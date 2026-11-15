export const SEARCH_CODE = [
  'search(root, key):',
  '  current = root',
  '  while current != null:',
  '    if key == current.key: return current   // found',
  '    else if key < current.key: current = current.left',
  '    else: current = current.right',
  '  return null   // not in the tree',
];

/** Line numbers in SEARCH_CODE for each phase of the search. */
export const LINE = { start: 1, found: 3, left: 4, right: 5, absent: 6 } as const;

export function Pseudocode({ active }: { active?: number }) {
  return (
    <pre className="code" aria-label="Iterative BST search pseudocode">
      {SEARCH_CODE.map((line, i) => (
        <span key={i} className={i === active ? 'code-line active' : 'code-line'}>
          {i === active ? '▶ ' : '  '}
          {line}
          {'\n'}
        </span>
      ))}
    </pre>
  );
}
