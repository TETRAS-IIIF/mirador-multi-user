interface HighlightTextProps {
  text: string;
  highlight: string;
}

export const HighlightText = ({ text, highlight }: HighlightTextProps) => {
  if (!text) return null;
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ backgroundColor: '#fff59d', padding: 0 }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};
