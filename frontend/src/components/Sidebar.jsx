import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  width: 250px;
  height: calc(100vh - 60px);
  background-color: #1b2838;
  color: #fff;
  padding: 1rem;
  display: flex;
  flex-direction: column;
`;

const FiltersContainer = styled.div`
  flex: 1;
  overflow-y: auto; /* Прокрутка только для фильтров */
`;

const FilterSection = styled.div`
  margin-bottom: 1.5rem;
`;

const FilterTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #2a2a2a;
  color: #fff;
  border: none;
  &:focus {
    outline: none;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
`;

const Checkbox = styled.input`
  cursor: pointer;
`;

const ResetButtonContainer = styled.div`
  position: sticky;
  bottom: 0;
  background-color: #1b2838; /* Фон кнопки совпадает с сайдбаром */
  padding: 0.5rem 0; /* Уменьшили отступы */
`;

const ResetButton = styled.button`
  width: 100%; /* Кнопка на всю ширину */
  padding: 0.5rem; /* Уменьшили padding */
  background-color: #4c6b8a;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background-color: #5a7fa3;
  }
  &:focus {
    outline: none;
  }
`;

const Sidebar = ({ onSort, onFilter, game, onResetFilters }) => {
  const cs2Types = ['', 'Pistol', 'Rifle', 'SMG', 'Sniper Rifle', 'Shotgun', 'Machine Gun', 'Knife', 'Gloves'];
  const cs2Rarities = ['', 'Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert'];
  const cs2Wears = ['', 'Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];

  const dota2Rarities = ["Any", "Common", "Uncommon", "Rare", "Mythical", "Legendary", "Immortal", "Arcana", "Ancient"];
  const dota2Heroes = [
    "Any", "Abaddon", "Alchemist", "Ancient Apparition", "Anti-Mage", "Anti-Mage (Wei)", "Arc Warden", "Axe", "Bane",
    "Batrider", "Beastmaster", "Bloodseeker", "Bounty Hunter", "Brewmaster", "Bristleback", "Broodmother",
    "Centaur Warrunner", "Chaos Knight", "Chen", "Clinkz", "Clockwerk", "Crystal Maiden", "Crystal Maiden (Wolf)",
    "Dark Seer", "Dark Willow", "Dazzle", "Death Prophet", "Disruptor", "Doom", "Dragon Knight", "Drow Ranger",
    "Earth Spirit", "Earthshaker", "Elder Titan", "Ember Spirit", "Enchantress", "Enigma", "Faceless Void",
    "Grimstroke", "Gyrocopter", "Hoodwink", "Huskar", "Invoker", "Invoker (Kid)", "Io", "Jakiro", "Juggernaut",
    "Keeper of the Light", "Kunkka", "Legion Commander", "Leshrac", "Lich", "Lifestealer", "Lina", "Lion",
    "Lone Druid", "Luna", "Lycan", "Magnus", "Marci", "Mars", "Medusa", "Meepo", "Mirana", "Monkey King",
    "Morphling", "Naga Siren", "Nature's Prophet", "Necrophos", "Night Stalker", "Nyx Assassin", "Ogre Magi",
    "Omniknight", "Oracle", "Other", "Outworld Destroyer", "Pangolier", "Phantom Assassin", "Phantom Lancer",
    "Phoenix", "Primal Beast", "Puck", "Pudge", "Pudge (Toy Butcher)", "Pugna", "Queen of Pain", "Razor", "Riki",
    "Rubick", "Sand King", "Shadow Demon", "Shadow Fiend", "Shadow Shaman", "Silencer", "Skywrath Mage", "Slardar",
    "Slark", "Snapfire", "Sniper", "Spectre", "Spirit Breaker", "Storm Spirit", "Sven", "Techies",
    "Templar Assassin", "Terrorblade", "Tidehunter", "Timbersaw", "Tinker", "Tiny", "Treant Protector",
    "Troll Warlord", "Tusk", "Underlord", "Undying", "Ursa", "Vengeful Spirit", "Venomancer", "Viper", "Visage",
    "Void Spirit", "Warlock", "Weaver", "Windranger", "Winter Wyvern", "Witch Doctor", "Wraith King", "Zeus"
  ];

  return (
    <SidebarContainer>
      <FiltersContainer>
        <FilterSection>
          <FilterTitle>Игра</FilterTitle>
          <Select onChange={(e) => onFilter('game', e.target.value)} value={game}>
            <option value="">Выберите игру</option>
            <option value="730">CS2</option>
            <option value="570">Dota 2</option>
          </Select>
        </FilterSection>

        {game && (
          <>
            <FilterSection>
              <FilterTitle>Сортировка</FilterTitle>
              <Select onChange={(e) => onSort(e.target.value)}>
                <option value="">Без сортировки</option>
                <option value="price_asc">По цене (возрастание)</option>
                <option value="price_desc">По цене (убывание)</option>
              </Select>
            </FilterSection>

            {game === '730' && (
              <>
                <FilterSection>
                  <FilterTitle>Тип</FilterTitle>
                  <Select onChange={(e) => onFilter('type', e.target.value)}>
                    {cs2Types.map(type => (
                      <option key={type} value={type}>{type || 'Все'}</option>
                    ))}
                  </Select>
                </FilterSection>
                <FilterSection>
                  <FilterTitle>Редкость</FilterTitle>
                  <Select onChange={(e) => onFilter('rarity', e.target.value)}>
                    {cs2Rarities.map(rarity => (
                      <option key={rarity} value={rarity}>{rarity || 'Все'}</option>
                    ))}
                  </Select>
                </FilterSection>
                <FilterSection>
                  <FilterTitle>Качество</FilterTitle>
                  <Select onChange={(e) => onFilter('wear', e.target.value)}>
                    {cs2Wears.map(wear => (
                      <option key={wear} value={wear}>{wear || 'Все'}</option>
                    ))}
                  </Select>
                </FilterSection>
                <FilterSection>
                  <FilterTitle>StatTrak</FilterTitle>
                  <CheckboxLabel>
                    <Checkbox
                      type="checkbox"
                      onChange={(e) => onFilter('stattrak', e.target.checked)}
                    />
                    Только StatTrak
                  </CheckboxLabel>
                </FilterSection>
              </>
            )}

            {game === '570' && (
              <>
                <FilterSection>
                  <FilterTitle>Герой</FilterTitle>
                  <Select onChange={(e) => onFilter('hero', e.target.value)}>
                    {dota2Heroes.map(hero => (
                      <option key={hero} value={hero}>{hero || 'Все'}</option>
                    ))}
                  </Select>
                </FilterSection>
                <FilterSection>
                  <FilterTitle>Редкость</FilterTitle>
                  <Select onChange={(e) => onFilter('rarity', e.target.value)}>
                    {dota2Rarities.map(rarity => (
                      <option key={rarity} value={rarity}>{rarity || 'Все'}</option>
                    ))}
                  </Select>
                </FilterSection>
              </>
            )}
          </>
        )}
      </FiltersContainer>

      {game && (
        <ResetButtonContainer>
          <ResetButton onClick={onResetFilters}>
            Сбросить фильтр
          </ResetButton>
        </ResetButtonContainer>
      )}
    </SidebarContainer>
  );
};

export default Sidebar;