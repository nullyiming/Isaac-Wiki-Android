package com.isaac.wiki;

import android.content.Context;
import java.io.InputStream;
import android.graphics.BitmapFactory;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import java.util.Map;
import android.util.LruCache;
import java.util.HashMap;
import android.graphics.Bitmap;

public class SpriteSheet {

    private final Context ctx;
    private final JSONObject coords;
    private final Map<String, Bitmap> sheets = new HashMap<>();
    private final LruCache<Integer, Bitmap> cache;

    public SpriteSheet(Context ctx) {
        this.ctx = ctx;
        this.coords = loadJson(ctx, "sprites.json");
        this.cache = new LruCache<>(8 * 1024 * 1024) {
            @Override protected int sizeOf(Integer k, Bitmap v) {
                return v.getByteCount() / 1024;
            }
        };
    }

    /** 根据道具 id 取图标（每个图标按它真实 w/h 切） */
    public Bitmap get(int id) {
        Bitmap bmp = cache.get(id);
        if (bmp != null) return bmp;
        try {
            JSONObject c = coords.getJSONObject(String.valueOf(id));
            String sheetName = c.getString("sheet");
            int x = c.getInt("x");
            int y = c.getInt("y");
            int w = c.getInt("w");
            int h = c.getInt("h");

            Bitmap sheet = getSheet(sheetName);
            if (sheet == null) return null;

            bmp = Bitmap.createBitmap(sheet, x, y, w, h);
            cache.put(id, bmp);
            return bmp;
        } catch (Exception e) {
            return null;
        }
    }

    private Bitmap getSheet(String name) {
        if (sheets.containsKey(name)) return sheets.get(name);
        try (InputStream is = ctx.getAssets().open("images/" + name)) {
            Bitmap b = BitmapFactory.decodeStream(is);
            sheets.put(name, b);
            return b;
        } catch (IOException e) {
            return null;
        }
    }

    private static JSONObject loadJson(Context ctx, String path) {
        try (InputStream is = ctx.getAssets().open(path);
             BufferedReader r = new BufferedReader(
                 new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
            return new JSONObject(sb.toString());
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    public void recycle() {
        cache.evictAll();
        for (Bitmap b : sheets.values()) {
            if (b != null && !b.isRecycled()) b.recycle();
        }
        sheets.clear();
    }
}