-- 개발용 예시 데이터. 여러 번 실행해도 안전하도록 전부 INSERT OR IGNORE 로 넣는다.
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO entries (layer, text, normalized, memo) VALUES
  ('root', 'spect — to look',   'spect',  '보다'),
  ('root', 'struct — to build', 'struct', '쌓다, 짓다'),
  ('root', 'port — to carry',   'port',   '나르다');

INSERT OR IGNORE INTO entries (layer, text, normalized, memo) VALUES
  ('word', 'inspect',        'inspect',        '자세히 들여다보다'),
  ('word', 'spectator',      'spectator',      ''),
  ('word', 'infrastructure', 'infrastructure', ''),
  ('word', 'export',         'export',         ''),
  ('word', 'portable',       'portable',       '');

INSERT OR IGNORE INTO entries (layer, text, normalized) VALUES
  ('sentence', 'Let me inspect the log before we deploy.',
               'let me inspect the log before we deploy'),
  ('sentence', 'The infrastructure team owns this pipeline.',
               'the infrastructure team owns this pipeline'),
  ('sentence', 'Export the report as CSV.',
               'export the report as csv');

-- 어원 → 단어 (직접 연결이 원칙인 관계)
INSERT OR IGNORE INTO links (parent_id, child_id, origin)
SELECT r.id, w.id, 'manual'
FROM entries r, entries w
WHERE r.layer = 'root' AND w.layer = 'word'
  AND (r.normalized, w.normalized) IN (
    VALUES ('spect', 'inspect'), ('spect', 'spectator'),
           ('struct', 'infrastructure'),
           ('port', 'export'), ('port', 'portable')
  );

-- 단어 → 문장 (6단계에서 자동으로 걸릴 관계를 미리 흉내낸 것)
INSERT OR IGNORE INTO links (parent_id, child_id, origin)
SELECT w.id, s.id, 'auto'
FROM entries w, entries s
WHERE w.layer = 'word' AND s.layer = 'sentence'
  AND ' ' || s.normalized || ' ' LIKE '% ' || w.normalized || ' %';
