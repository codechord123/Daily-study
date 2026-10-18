// "{3/4}" 표기를 세로 분수로 그린다. "1{1/2}" 은 대분수.
export default function RichText({ text }) {
  const parts = String(text).split(/(\{\d+\/\d+\})/);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{(\d+)\/(\d+)\}$/);
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
