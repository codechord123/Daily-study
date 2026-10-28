// "{3/4}" 표기를 세로 분수로 그린다. "1{1/2}" 은 대분수, "{9+9+9/1000}" 처럼 분자에 식도 쓸 수 있다.
// neg: '알맞지 않은', '아닌', '틀린' 처럼 거꾸로 묻는 말을 눈에 띄게 (놓치고 반대로 고르지 않게)
const NEG = /(알맞지 않은|옳지 않은|맞지 않은|관계없는|관계가 없는|잘못된|않은|아닌|틀린|없는)/;
export default function RichText({ text, neg = false }) {
  const parts = String(text).split(/(\{[0-9+×. ]+\/[0-9+×. ]+\})/);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{([0-9+×. ]+)\/([0-9+×. ]+)\}$/);
        if (!m && neg && NEG.test(p))
          return (
            <span key={i}>
              {p.split(NEG).map((w, j) => (j % 2 ? <em key={j} className="neg">{w}</em> : w))}
            </span>
          );
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
