-- Item Repair Hub v2.3.1: included Cocytus Armor hook.
item("Cocytus_Armor_US", {
    on_attack = function(c)
        if c.skill_id ~= 0 or c.ranged or not c.connected or c.damage <= 0 then
            return
        end
        local armor = c.caster:equipment("armor")
        if not armor or armor.name ~= "Cocytus_Armor_US" or armor.refine < 12 then
            return
        end
        if c:chance(2000) then
            c:cast("MG_COLDBOLT", 10, "target")
        end
        if c:chance(2000) then
            c:cast("WZ_STORMGUST", 10, "target")
        end
    end,
})
