// "{3/4}" 표기를 세로 분수로 그린다. "1{1/2}" 은 대분수, "{9+9+9/1000}" 처럼 분자에 식도 쓸 수 있다.
export default function RichText({ text }) {
  const parts = String(text).split(/(\{[0-9+×. ]+\/[0-9+×. ]+\})/);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{([0-9+×. ]+)\/([0-9+×. ]+)\}$/);
        if (!m) return <span key={i}>{p}</span>;
        return (
          <span key={i} className="frac" aria-label={`${m[2]}분의 ${m[1]}`}>
            <span className="frac-n">{m[1]}</span>
            <span className="frac-d">{m[2]}</span>
          </span>
        );
      })}
    </>
  );
}
