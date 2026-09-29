package com.isaac.wiki;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.net.Uri;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.isaac.wiki.ItemData;
import com.isaac.wiki.ItemParser;
import com.isaac.wiki.ListAdapter;
import com.isaac.wiki.databinding.ActivityMainBinding;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class MainActivity extends AppCompatActivity {
    private ActivityMainBinding binding;
    private List<ItemData> allDatas = new ArrayList<>();
    private List<ItemData> datas = new ArrayList<>();
    private SpriteSheet sprites;
    private String searchKeyword = "";
    private boolean searchAll;
    private boolean filter_rebirth = true;
    private boolean filter_afterbirth = true;
    private boolean filter_afterbirth_dagger = true;
    private boolean filter_repentance = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Inflate and get instance of binding
        binding = ActivityMainBinding.inflate(getLayoutInflater());

        // set content view to binding's root
        setContentView(binding.getRoot());
        sprites = new SpriteSheet(this);
        allDatas.addAll(ItemParser.parseFromAssets(this, "items_data.json"));
        datas.addAll(allDatas);
        binding.listView.setLayoutManager(new LinearLayoutManager(this));
        binding.listView.setAdapter(
                new ListAdapter(
                        this,
                        datas,
                        sprites,
                        pos -> {
                            ItemData data = datas.get(pos);
                            String content = data.details;
                            new MaterialAlertDialogBuilder(this)
                                    .setIcon(new BitmapDrawable(sprites.get(data.id)))
                                    .setTitle(data.name_zh + "/" + data.name_en)
                                    .setMessage(content)
                                    .setPositiveButton(
                                            "复制",
                                            (dialog, which) -> {
                                                ClipboardManager cm =
                                                        (ClipboardManager)
                                                                getSystemService(CLIPBOARD_SERVICE);
                                                ClipData clip =
                                                        ClipData.newPlainText("content", content);
                                                cm.setPrimaryClip(clip);
                                            })
                                    .create()
                                    .show();
                        }));
        binding.about.setOnClickListener(
                v -> {
                    new MaterialAlertDialogBuilder(this)
                            .setIcon(R.drawable.about)
                            .setTitle("关于")
                            .setMessage(
                                    """
以撒的结合 图鉴

版本 1.0.0

一个本地离线的道具查询工具，收录主动道具、被动道具、塔罗牌、饰品。

包含的游戏版本：重生、胎衣、胎衣†、忏悔。

数据来自 https://github.com/cy1499279216-del/isaac-items。

《以撒的结合》版权归 Edmund McMillen 与 Nicalis 所有。

本 App 为非官方个人项目，与官方无关。

bilibili: 一块大大大饼""")
                            .setPositiveButton(
                                    "作者主页",
                                    (dialog, which) -> {
                                        String url = "https://space.bilibili.com/3461576229128484";
                                        Intent intent =
                                                new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                        intent.setPackage("tv.danmaku.bili"); // 直接指定 B 站
                                        try {
                                            startActivity(intent);
                                        } catch (Exception e) {
                                            // 没装 B 站，回落浏览器
                                            startActivity(
                                                    new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                                        }
                                    })
                            .create()
                            .show();
                });
        binding.checkSearchAll.setOnCheckedChangeListener(
                (bn, cd) -> {
                    searchAll = cd;
                    filter();
                });
        binding.checkFilterRebirth.setOnCheckedChangeListener(
                (bn, cd) -> {
                    filter_rebirth = cd;
                    filter();
                });
        binding.checkFilterAfterbirth.setOnCheckedChangeListener(
                (bn, cd) -> {
                    filter_afterbirth = cd;
                    filter();
                });
        binding.checkFilterAfterbirthDagger.setOnCheckedChangeListener(
                (bn, cd) -> {
                    filter_afterbirth_dagger = cd;
                    filter();
                });
        binding.checkFilterRepentance.setOnCheckedChangeListener(
                (bn, cd) -> {
                    filter_repentance = cd;
                    filter();
                });
        binding.searchEdit.addTextChangedListener(
                new TextWatcher() {
                    @Override
                    public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                        // 变化前
                    }

                    @Override
                    public void onTextChanged(CharSequence s, int start, int before, int count) {
                        // 变化中，实时触发
                    }

                    @Override
                    public void afterTextChanged(Editable s) {
                        // 变化后，一般在这里处理
                        searchKeyword = s.toString().toLowerCase();
                        filter();
                    }
                });
    }

    public void filter() {
        datas.clear();
        datas.addAll(
                allDatas.stream()
                        .filter(
                                item -> {
                                    if (!isVersionEnabled(item.source)) {
                                        return false;
                                    }
                                    String content = item.name_zh + "/" + item.name_en;
                                    if (searchAll) {
                                        content += item.details;
                                    }
                                    return content.toLowerCase().contains(searchKeyword);
                                })
                        .collect(Collectors.toList()));
        binding.listView.getAdapter().notifyDataSetChanged();
    }

    private boolean isVersionEnabled(String source) {
        switch (source) {
            case "重生":
                return filter_rebirth;
            case "胎衣":
                return filter_afterbirth;
            case "胎衣†":
                return filter_afterbirth_dagger;
            case "忏悔":
                return filter_repentance;
            default:
                return true;
        }
    }

    public void s(String msg) {
        StackTraceElement e = Thread.currentThread().getStackTrace()[3];
        Toast.makeText(
                        this,
                        e.getMethodName() + ":" + e.getLineNumber() + " " + msg,
                        Toast.LENGTH_SHORT)
                .show();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        this.binding = null;
    }
}
