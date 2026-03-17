INSERT INTO categories (user_id, name, type) VALUES
  (NULL, '餐饮美食', 'expense'),
  (NULL, '交通出行', 'expense'),
  (NULL, '居住物业', 'expense'),
  (NULL, '宠物开销', 'expense'),
  (NULL, '购物娱乐', 'expense');

INSERT INTO category_rules (user_id, category_id, pattern, is_regex, priority)
SELECT NULL, c.id, r.pattern, FALSE, 100
FROM categories c
JOIN (
  VALUES
    ('餐饮美食', '外卖'), ('餐饮美食', '餐饮'), ('餐饮美食', '麦当劳'), ('餐饮美食', '普洱茶'),
    ('交通出行', '打车'), ('交通出行', '高铁'), ('交通出行', '帕萨特保养'), ('交通出行', '停车费'), ('交通出行', '加油'),
    ('居住物业', '房租'), ('居住物业', '宽带'), ('居住物业', '水电燃气'),
    ('宠物开销', '猫砂'), ('宠物开销', '狗粮'), ('宠物开销', '宠物医院'),
    ('购物娱乐', '淘宝'), ('购物娱乐', '游戏'), ('购物娱乐', 'Steam')
) AS r(category_name, pattern)
ON c.name = r.category_name;
