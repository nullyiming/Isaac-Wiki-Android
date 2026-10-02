package com.isaac.wiki;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ItemData {
    public int id;
    public String name_zh;
    public String name_en;
    public String alias;
    public String category;
    public boolean is_active;
    public String charge;
    public String quote_zh;
    public String quote_en;
    public int quality;
    public String pools_zh;
    public String pools_raw;
    public String unlock;
    public String effect;
    public String source;
    public String tags;
    public Map<String, String> stat_modifiers = new LinkedHashMap<>();
    public List<String> mechanic_tags = new ArrayList<>();
    public String appearance;
    public String image_url;
    public String sprite_cls;
    public String details;
    
    public ItemData() {
    	
    }

    public boolean isChargeEmpty() {
        return charge == null || charge.isEmpty();
    }

    public List<String> getTypes() {
        List<String> types = new ArrayList<>();
        types.add(category);
        types.addAll(mechanic_tags);
        return types;
    }

    @Override
    public String toString() {
        // TODO: Implement this method
        return String.format(
                "别名: %s\n\n类型: %s\n\n是否是主动道具: %s\n\n"
                        + (isChargeEmpty() ? "%s" : "充能: %s\n\n")
                        + "描述: %s\n\n品质: %d\n\n所属道具池: %s\n\n解锁条件: %s\n\n效果: %s\n\n以撒版本: %s\n\n标签: %s\n\n"
                        + (stat_modifiers.isEmpty() ? "%s" : "属性修正: %s\n"),
                alias,
                String.join(", ", getTypes().toArray(new String[] {})),
                is_active ? "是" : "否",
                isChargeEmpty() ? "" : charge,
                quote_zh + "/" + quote_en,
                quality,
                pools_zh,
                unlock,
                effect.replace("#", "\n       "),
                source,
                tags,
                stat_modifiers.isEmpty()
                        ? ""
                        : "\n    "
                                + String.join(
                                        "\n    ",
                                        stat_modifiers.entrySet().stream()
                                                .map(e -> e.getKey() + "：" + e.getValue())
                                                .collect(Collectors.toList())));
    }
}
