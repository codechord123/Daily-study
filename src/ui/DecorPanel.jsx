import { useState } from 'react';
import { useGame } from '../store/useGame';
import { useUI } from '../store/useUI';
import { ITEMS, ITEM_BY_ID, ITEM_CATEGORIES, CHAR_PARTS, SLOT_LABEL, DEFAULT_CHARACTER } from '../data/items';
import { PLANET_TINTS, PLANET_DECO } from '../theme/tokens';
import ItemThumb from './ItemThumb';
import { sfx } from '../services/sound';

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
          const short = profile.stardust < it.price;
          return (
            <button
              key={it.id}
              className={`item-card ${short ? 'is-short' : ''}`}
              onClick={() => {
                if (short) return showToast(`별가루가 ${it.price - profile.stardust}개 더 필요해요`);
                if (buyItem(it.id)) {
                  sfx('buy');
                  showToast(`${it.name}을(를) 가방에 넣었어요`);
                  onBought(it.id);
                }
              }}
            >
              <ItemThumb itemId={it.id} />
              <span className="item-name">{it.name}</span>
              <span className="item-price">✦ {it.price}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

const DECO_LABEL = { ring: '고리', moon: '위성', aura: '빛 무리' };

function Tints() {
  const { profile, setTint, setPlanetPart } = useGame();
  const showToast = useUI((s) => s.showToast);
  const owned = (slot, p) => p.price === 0 || profile.ownedParts.includes(`planet:${slot}:${p.id}`);
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
            <div className="swatches">
              {parts.map((p) => (
                <button key={p.id} className={`pill ${cur === p.id ? 'on' : ''}`} onClick={() => pickDeco(slot, p)} data-nosfx>
                  {p.color && p.color !== 'rainbow' && <span className="pill-dot" style={{ background: p.color }} />}
                  {p.name}
                  {!owned(slot, p) && <small> ✦{p.price}</small>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Looks() {
  const { profile, wearPart } = useGame();
  const showToast = useUI((s) => s.showToast);
  const look = { ...DEFAULT_CHARACTER, ...profile.planet.character };
  const owned = (slot, p) => p.price === 0 || profile.ownedParts.includes(`${slot}:${p.id}`);
  const tryWear = (slot, p) => {
    if (!owned(slot, p) && profile.stardust < p.price) return showToast(`별가루가 ${p.price - profile.stardust}개 더 필요해요`);
    const bought = !owned(slot, p);
    if (wearPart(slot, p.id)) {
      if (bought) {
        sfx('buy');
        showToast('새 옷을 샀어요!');
      } else sfx('rotate');
    }
  };
  return (
    <div className="looks" data-nosfx>
      {Object.entries(CHAR_PARTS).map(([slot, parts]) => (
        <div key={slot} className="look-row">
          <span className="look-label">{SLOT_LABEL[slot]}</span>
          <div className="swatches">
            {parts.map((p) =>
              p.color && !p.name ? (
                <button
                  key={p.id}
                  className={`swatch ${look[slot] === p.id ? 'on' : ''}`}
                  style={{ background: p.color }}
                  onClick={() => tryWear(slot, p)}
                  aria-label={`${SLOT_LABEL[slot]} ${p.id}`}
                >
                  {!owned(slot, p) && <span className="swatch-price">✦{p.price}</span>}
                </button>
              ) : (
                <button key={p.id} className={`pill ${look[slot] === p.id ? 'on' : ''}`} onClick={() => tryWear(slot, p)}>
                  {p.name}
                  {!owned(slot, p) && <small> ✦{p.price}</small>}
                </button>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DecorPanel({ onDone }) {
  const [tab, setTab] = useState('bag');
  const { rotateItem, storeItem } = useGame();
  const { heldItem, selectedUid, movingUid, hold, startMove, clearDecor } = useUI();

  const hint = movingUid
    ? '옮길 곳을 별 위에서 눌러요'
    : heldItem
      ? `별의 원하는 곳을 눌러 ${ITEM_BY_ID[heldItem]?.name}을(를) 놓아요`
      : selectedUid
        ? '고른 소품을 돌리거나 옮길 수 있어요'
        : tab === 'bag'
          ? '소품을 고르고 별을 눌러 놓아요 · 별 위 소품을 누르면 고칠 수 있어요'
          : null;

  return (
    <>
      {selectedUid && !movingUid && (
        <div className="item-tools panel rise">
          <button className="btn" data-nosfx onClick={() => (sfx('rotate'), rotateItem(selectedUid, 45))}>↻ 돌리기</button>
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
        </div>
      )}

      <section className="decor panel rise" aria-label="별 꾸미기">
        <header className="decor-head">
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={onDone}>다 꾸몄어요</button>
        </header>
        {hint && <p className={`decor-hint ${heldItem || movingUid ? 'is-active' : ''}`}>{hint}</p>}
        <div className="decor-body">
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
