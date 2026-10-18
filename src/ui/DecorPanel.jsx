import { useEffect, useRef, useState } from 'react';
import { priceOf } from '../store/classSettings';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';
import { ITEMS, ITEM_BY_ID, ITEM_CATEGORIES } from '../data/items';
import { OPTION_SLOTS, COLOR_SLOTS, PALETTE, LOOK_GROUPS, normalizeLook, SPECIES_WITH_HAIR } from '../data/character';
import { PLANET_TINTS, PLANET_DECO } from '../theme/tokens';
import ItemThumb, { Thumb } from './ItemThumb';

// 그림 카드 하나: 썸네일 + 이름 + 가격(안 가진 것만)
function OptCard({ kind, k, name, price, owned, on, onClick }) {
  return (
    <button className={`opt-card ${on ? 'on' : ''} ${owned ? '' : 'locked'}`} onClick={onClick} data-nosfx>
      <Thumb kind={kind} k={k} size={56} fallback={<span className="opt-none">없음</span>} />
      <span className="opt-name">{name}</span>
      {!owned && <span className="opt-price">✦{price}</span>}
      {on && <span className="opt-check" aria-hidden>✓</span>}
    </button>
  );
}
import { sfx } from '../services/sound';
import { useEscape } from './useEscape';

const TABS = [
  { id: 'bag', label: '가방' },
  { id: 'shop', label: '상점' },
  { id: 'tint', label: '별 꾸미기' },
  { id: 'me', label: '내 모습' },
];


function Bag() {
  const inventory = useGame((s) => s.profile.inventory);
  const { heldItem, hold } = useUI();
  const entries = Object.entries(inventory);
  if (!entries.length)
    return <p className="empty">가방이 비었어요. 상점에서 소품을 골라 보세요.</p>;
  return (
    <div className="item-grid">
      {entries.map(([id, n]) => (
        <button key={id} className={`item-card ${heldItem === id ? 'is-held' : ''}`} onClick={() => hold(heldItem === id ? null : id)}>
          <ItemThumb itemId={id} />
          <span className="item-name">{ITEM_BY_ID[id]?.name}</span>
          <span className="item-count">×{n}</span>
        </button>
      ))}
    </div>
  );
}

function Shop({ onBought }) {
  const { profile, buyItem } = useGame();
  const showToast = useUI((s) => s.showToast);
  const [cat, setCat] = useState('nature');
  return (
    <>
      <div className="seg">
        {ITEM_CATEGORIES.map((c) => (
          <button key={c.id} className={`seg-btn ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="item-grid">
        {ITEMS.filter((i) => i.category === cat).map((it) => {
          const price = priceOf(it.price);
          const short = profile.stardust < price;
          return (
            <button
              key={it.id}
              className={`item-card ${short ? 'is-short' : ''}`}
              onClick={() => {
                if (short) return showToast(`별가루가 ${price - profile.stardust}개 더 필요해요`);
                if (buyItem(it.id)) {
                  sfx('buy');
                  showToast(`${it.name}을(를) 가방에 넣었어요`);
                  onBought(it.id);
                }
              }}
            >
              <ItemThumb itemId={it.id} />
              <span className="item-name">{it.name}</span>
              <span className="item-price">{price ? `✦ ${price}` : '무료'}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

const DECO_LABEL = { pattern: '무늬', ambient: '주변 효과', ring: '고리', moon: '위성', aura: '빛 무리' };

function Tints() {
  const { profile, setTint, setPlanetPart } = useGame();
  const showToast = useUI((s) => s.showToast);
  const owned = (slot, p) => priceOf(p.price) === 0 || profile.ownedParts.includes(`planet:${slot}:${p.id}`);
  const pickDeco = (slot, p) => {
    if (!owned(slot, p) && profile.stardust < p.price) return showToast(`별가루가 ${p.price - profile.stardust}개 더 필요해요`);
    const bought = !owned(slot, p);
    if (setPlanetPart(slot, p.id)) {
      sfx(bought ? 'buy' : 'rotate');
      if (bought) showToast(`${p.name}을(를) 달았어요!`);
    }
  };
  return (
    <div className="looks">
      <div className="look-row">
        <span className="look-label">별 색</span>
        <div className="swatches">
          {PLANET_TINTS.map((t) => (
            <button
              key={t.id}
              className={`swatch ${profile.planet.tint === t.id ? 'on' : ''}`}
              style={{ background: `radial-gradient(circle at 35% 30%, ${t.base}, ${t.shade})` }}
              onClick={() => (sfx('rotate'), setTint(t.id))}
              aria-label={`별 색 ${t.id}`}
              data-nosfx
            />
          ))}
        </div>
      </div>
      {Object.entries(PLANET_DECO).map(([slot, parts]) => {
        const cur = profile.planet[slot] ?? parts[0].id;
        return (
          <div key={slot} className="look-row">
            <span className="look-label">{DECO_LABEL[slot]}</span>
            <div className="opt-grid">
              {parts.map((p) => (
                <OptCard key={p.id} kind="deco" k={`${slot}:${p.id}`} name={p.name} price={p.price} owned={owned(slot, p)} on={cur === p.id} onClick={() => pickDeco(slot, p)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Looks() {
  const { profile, wearPart, setLookColor, setLook, ownsPart } = useGame();
  const showToast = useUI((s) => s.showToast);
  const [group, setGroup] = useState('body');
  const look = normalizeLook(profile.planet.character);
  const owned = (slot, p) => priceOf(p.price) === 0 || profile.ownedParts.includes(`${slot}:${p.id}`);
  const tryWear = (slot, p) => {
    if (!owned(slot, p) && profile.stardust < p.price) return showToast(`별가루가 ${p.price - profile.stardust}개 더 필요해요`);
    const bought = !owned(slot, p);
    if (wearPart(slot, p.id)) {
      sfx(bought ? 'buy' : 'rotate');
      if (bought) showToast(`${p.name}을(를) 얻었어요!`);
    }
  };
  // 🎲 가진 것·무료 중에서 무작위로 조합
  const randomize = () => {
    const patch = {};
    for (const [slot, def] of Object.entries(OPTION_SLOTS)) {
      const mine = def.options.filter((p) => ownsPart(slot, p.id));
      patch[slot] = mine[Math.floor(Math.random() * mine.length)].id;
    }
    for (const slot of Object.keys(COLOR_SLOTS)) patch[slot] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    setLook(patch);
    sfx('star');
  };
  const slots = LOOK_GROUPS.find((g) => g.id === group).slots.filter((s) => s !== 'hairStyle' && s !== 'hair' ? true : SPECIES_WITH_HAIR.has(look.species));

  return (
    <div className="looks" data-nosfx>
      <div className="seg">
        {LOOK_GROUPS.map((g) => (
          <button key={g.id} className={`seg-btn ${group === g.id ? 'on' : ''}`} onClick={() => setGroup(g.id)}>
            {g.label}
          </button>
        ))}
        <button className="seg-btn dice" onClick={randomize} title="가진 것 중에서 무작위로 꾸미기">🎲 랜덤</button>
      </div>
      {!SPECIES_WITH_HAIR.has(look.species) && group === 'head' && <p className="empty small">이 종족은 머리카락 대신 귀가 있어요. 머리 장식은 쓸 수 있어요!</p>}
      {slots.map((slot) =>
        COLOR_SLOTS[slot] ? (
          <div key={slot} className="look-row">
            <span className="look-label">{COLOR_SLOTS[slot].label}</span>
            <div className="palette">
              {PALETTE.map((hex) => (
                <button
                  key={hex}
                  className={`dot ${look[slot] === hex ? 'on' : ''}`}
                  style={{ background: hex }}
                  onClick={() => (sfx('key'), setLookColor(slot, hex))}
                  aria-label={`${COLOR_SLOTS[slot].label} ${hex}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div key={slot} className="look-row">
            <span className="look-label">{OPTION_SLOTS[slot].label}</span>
            <div className="opt-grid">
              {OPTION_SLOTS[slot].options.map((p) => (
                <OptCard key={p.id} kind="char" k={`${slot}:${p.id}`} name={p.name} price={p.price} owned={owned(slot, p)} on={look[slot] === p.id} onClick={() => tryWear(slot, p)} />
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export default function DecorPanel({ onDone }) {
  const [tab, setTab] = useState('bag');
  const [folded, setFolded] = useState(false); // 휴대폰: 창을 접어 별을 크게 본다
  // 소품 도구 막대를 꾸미기 창 바로 위에 붙이려고 창의 실제 높이를 CSS 변수로 알려 준다
  const panelRef = useRef(null);
  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty('--decor-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => (ro.disconnect(), root.style.removeProperty('--decor-h'));
  }, []);
  const { rotateItem, storeItem, recolorItem, resizeItem, profile } = useGame();
  const [colorOpen, setColorOpen] = useState(false);
  const { heldItem, selectedUid, movingUid, hold, startMove, clearDecor, setLookFocus } = useUI();
  useEffect(() => {
    setLookFocus(tab === 'me');
    if (tab === 'me') clearDecor(); // 내 모습을 볼 때 소품 도구가 캐릭터를 가리지 않게
    return () => setLookFocus(false);
  }, [tab, setLookFocus, clearDecor]);

  const selItem = selectedUid ? profile.planet.items.find((i) => i.uid === selectedUid) : null;
  useEffect(() => setColorOpen(false), [selectedUid]);
  // 크롬북 단축키: R 돌리기 · C 색 · Delete 가방에 넣기
  useEffect(() => {
    if (!selectedUid || movingUid) return;
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'r') (sfx('rotate'), rotateItem(selectedUid, 45));
      else if (k === 'c') (sfx('star'), recolorItem(selectedUid));
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        sfx('store');
        storeItem(selectedUid);
        clearDecor();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedUid, movingUid, rotateItem, recolorItem, storeItem, clearDecor]);
  // Esc: 들고 있던 소품·고른 소품을 내려놓는다
  useEscape(clearDecor, !!(heldItem || selectedUid || movingUid));

  const hint = movingUid
    ? '옮길 곳을 별 위에서 눌러요'
    : heldItem
      ? `별의 원하는 곳을 눌러 ${ITEM_BY_ID[heldItem]?.name}을(를) 놓아요`
      : selectedUid
        ? '고른 소품을 끌어서 옮기거나, 버튼으로 돌리고 꾸며요 (키보드 R 돌리기 · C 색 · Delete 넣기)'
        : tab === 'bag'
          ? '소품을 고르고 별을 눌러 놓아요 · 별 위 소품을 누르면 고칠 수 있어요'
          : null;

  return (
    <>
      {selectedUid && !movingUid && (
        <div className="item-tools panel rise">
          <button className="btn" data-nosfx onClick={() => (sfx('rotate'), rotateItem(selectedUid, 45))}>↻ 돌리기</button>
          <button className={`btn ${colorOpen ? 'on' : ''}`} data-nosfx onClick={() => setColorOpen((o) => !o)} aria-expanded={colorOpen}>🎨 색</button>
          <button className="btn" data-nosfx onClick={() => (sfx('rotate'), resizeItem(selectedUid))}>⤢ 크기</button>
          <button className="btn" onClick={() => startMove(selectedUid)}>✥ 옮기기</button>
          <button
            className="btn"
            data-nosfx
            onClick={() => {
              sfx('store');
              storeItem(selectedUid);
              clearDecor();
            }}
          >
            ⤓ 가방에 넣기
          </button>
          <button className="btn btn-icon btn-ghost" onClick={clearDecor} aria-label="선택 해제">✕</button>
          {colorOpen && (
            <div className="hue-row" role="group" aria-label="색 고르기">
              {Array.from({ length: 8 }, (_, h) => (
                <button
                  key={h}
                  className={`hue-dot ${(selItem?.hue ?? 0) === h ? 'on' : ''}`}
                  style={{ '--h': h }}
                  data-nosfx
                  onClick={() => (sfx('star'), recolorItem(selectedUid, h))}
                  aria-label={h ? `색 ${h + 1}` : '원래 색'}
                >
                  {h === 0 ? '원래' : ''}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <section ref={panelRef} className={`decor panel rise ${folded ? 'is-folded' : ''}`} aria-label="별 꾸미기">
        <header className="decor-head">
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => (setTab(t.id), setFolded(false))}>
                {t.label}
              </button>
            ))}
          </div>
          <button className="fold-btn" onClick={() => setFolded((f) => !f)} aria-label={folded ? '꾸미기 창 펼치기' : '꾸미기 창 접기'} aria-expanded={!folded}>
            {folded ? '▴ 펼치기' : '▾ 접기'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={onDone}>완료</button>
        </header>
        {hint && !folded && <p className={`decor-hint ${heldItem || movingUid ? 'is-active' : ''}`}>{hint}</p>}
        <div className="decor-body" hidden={folded}>
          {tab === 'bag' && <Bag />}
          {tab === 'shop' && (
            <Shop
              onBought={(id) => {
                setTab('bag');
                hold(id);
              }}
            />
          )}
          {tab === 'tint' && <Tints />}
          {tab === 'me' && <Looks />}
        </div>
      </section>
    </>
  );
}
