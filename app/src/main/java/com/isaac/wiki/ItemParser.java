package com.isaac.wiki;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class ItemParser {

    /** 从 assets 读整个 items_data.json 并解析成 List */
    public static List<ItemData> parseFromAssets(Context ctx, String assetPath) {
        String json = readAsset(ctx, assetPath);
        return parse(json);
    }

    /** 解析 JSON 字符串 */
    public static List<ItemData> parse(String json) {
        List<ItemData> list = new ArrayList<>();
        if (json == null || json.isEmpty()) return list;
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                list.add(parseOne(o));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /** 解析单个对象 */
    public static ItemData parseOne(JSONObject o) {
        ItemData d = new ItemData();

        d.id           = o.optInt("id");
        d.name_zh      = o.optString("name_zh", "");
        d.name_en      = o.optString("name_en", "");
        d.alias        = o.optString("alias", "");
        d.category     = o.optString("category", "");
        d.is_active    = o.optBoolean("is_active", false);
        d.charge       = o.optString("charge", "");
        d.quote_zh     = o.optString("quote_zh", "");
        d.quote_en     = o.optString("quote_en", "");
        d.quality      = o.optInt("quality", 0);
        d.pools_zh     = o.optString("pools_zh", "");
        d.pools_raw    = o.optString("pools_raw", "");
        d.unlock       = o.optString("unlock", "");
        d.effect       = o.optString("effect", "");
        d.source       = o.optString("source", "");
        d.tags         = o.optString("tags", "");
        d.appearance   = o.optString("appearance", "");
        d.image_url    = o.optString("image_url", "");
        d.sprite_cls   = o.optString("sprite_cls", "");

        // stat_modifiers：可能是 {}，也可能缺失
        JSONObject statObj = o.optJSONObject("stat_modifiers");
        if (statObj != null) {
            Iterator<String> keys = statObj.keys();
            while (keys.hasNext()) {
                String k = keys.next();
                d.stat_modifiers.put(k, statObj.optString(k, ""));
            }
        }

        // mechanic_tags：可能是 []，也可能缺失
        JSONArray tagArr = o.optJSONArray("mechanic_tags");
        if (tagArr != null) {
            for (int i = 0; i < tagArr.length(); i++) {
                d.mechanic_tags.add(tagArr.optString(i, ""));
            }
        }
        d.details = d.toString();
        return d;
    }

    /** 从 assets 读字符串 */
    private static String readAsset(Context ctx, String path) {
        try (InputStream is = ctx.getAssets().open(path);
             BufferedReader r = new BufferedReader(
                     new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
            return sb.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}