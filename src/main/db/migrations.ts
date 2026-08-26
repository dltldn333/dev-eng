export interface Migration {
  version: number
  name: string
  up: string
}

/**
 * 스키마 변경은 항상 새 마이그레이션을 덧붙이는 방식으로 한다.
 * 이미 배포된 버전의 SQL은 절대 수정하지 않는다 (사용자 DB가 이미 그걸 적용했으므로).
 */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    up: `
      -- 어원 → 단어 → 문장. 세 레이어가 같은 형태(주제·메모·태그·연결·방문수)라
      -- 테이블을 쪼개지 않고 layer 구분자로 한 테이블에 담는다.
      CREATE TABLE entries (
        id          INTEGER PRIMARY KEY,
        layer       TEXT    NOT NULL CHECK (layer IN ('root', 'word', 'sentence')),
        text        TEXT    NOT NULL,
        normalized  TEXT    NOT NULL,
        memo        TEXT    NOT NULL DEFAULT '',
        visit_count INTEGER NOT NULL DEFAULT 0,
        visited_at  TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      -- 같은 레이어 안에서 같은 표기가 중복 등록되는 것을 막는다.
      CREATE UNIQUE INDEX ux_entries_layer_normalized ON entries (layer, normalized);

      -- 연결은 항상 (상위 레이어 → 하위 레이어) 방향으로 저장한다.
      -- origin 은 자동으로 걸린 연결과 손으로 건 연결을 구분한다.
      -- 자동 연결을 재계산할 때 수동 연결을 보존하고, 오탐을 사용자가 끊을 수 있어야 하기 때문.
      CREATE TABLE links (
        parent_id  INTEGER NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
        child_id   INTEGER NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
        origin     TEXT    NOT NULL DEFAULT 'manual' CHECK (origin IN ('auto', 'manual')),
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (parent_id, child_id)
      );

      -- 하위 → 상위 방향 조회(문장에서 단어 찾기 등)를 위한 인덱스.
      CREATE INDEX ix_links_child ON links (child_id);

      CREATE TABLE tags (
        id    INTEGER PRIMARY KEY,
        name  TEXT NOT NULL UNIQUE,
        color TEXT
      );

      CREATE TABLE entry_tags (
        entry_id INTEGER NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
        tag_id   INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
        PRIMARY KEY (entry_id, tag_id)
      );

      CREATE INDEX ix_entry_tags_tag ON entry_tags (tag_id);

      -- 자동 연결 가속용. 문장을 등록할 때 정규화된 토큰을 미리 쪼개 넣어두고,
      -- 단어를 등록할 때 이 인덱스만 조회해서 포함 문장을 찾는다.
      CREATE TABLE sentence_tokens (
        sentence_id INTEGER NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
        token       TEXT    NOT NULL,
        PRIMARY KEY (sentence_id, token)
      );

      CREATE INDEX ix_sentence_tokens_token ON sentence_tokens (token);

      -- 인접 레이어(어원-단어, 단어-문장)만 연결을 허용한다.
      -- 어원과 문장을 직접 잇는 연결은 DB 차원에서 막는다.
      CREATE TRIGGER trg_links_adjacent_insert
      BEFORE INSERT ON links
      FOR EACH ROW
      WHEN NOT (
        ((SELECT layer FROM entries WHERE id = NEW.parent_id) = 'root'
          AND (SELECT layer FROM entries WHERE id = NEW.child_id) = 'word')
        OR
        ((SELECT layer FROM entries WHERE id = NEW.parent_id) = 'word'
          AND (SELECT layer FROM entries WHERE id = NEW.child_id) = 'sentence')
      )
      BEGIN
        SELECT RAISE(ABORT, '인접한 레이어끼리만 연결할 수 있습니다 (어원-단어, 단어-문장)');
      END;

      CREATE TRIGGER trg_links_adjacent_update
      BEFORE UPDATE OF parent_id, child_id ON links
      FOR EACH ROW
      WHEN NOT (
        ((SELECT layer FROM entries WHERE id = NEW.parent_id) = 'root'
          AND (SELECT layer FROM entries WHERE id = NEW.child_id) = 'word')
        OR
        ((SELECT layer FROM entries WHERE id = NEW.parent_id) = 'word'
          AND (SELECT layer FROM entries WHERE id = NEW.child_id) = 'sentence')
      )
      BEGIN
        SELECT RAISE(ABORT, '인접한 레이어끼리만 연결할 수 있습니다 (어원-단어, 단어-문장)');
      END;

      -- 토큰은 문장에만 붙는다.
      CREATE TRIGGER trg_sentence_tokens_layer
      BEFORE INSERT ON sentence_tokens
      FOR EACH ROW
      WHEN (SELECT layer FROM entries WHERE id = NEW.sentence_id) <> 'sentence'
      BEGIN
        SELECT RAISE(ABORT, '토큰은 문장 레이어에만 저장할 수 있습니다');
      END;

      -- updated_at 을 손으로 챙기지 않아도 되게 한다.
      -- 호출부가 updated_at 을 직접 지정한 경우에는 건드리지 않는다.
      CREATE TRIGGER trg_entries_touch_updated_at
      AFTER UPDATE ON entries
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE entries SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
    `
  },
  {
    version: 2,
    name: 'do not touch updated_at on visits',
    up: `
      -- 디테일 뷰를 열면 visit_count 가 오른다. 그건 편집이 아니므로 updated_at 은 그대로여야 한다.
      -- 어떤 컬럼이 바뀌었는지를 보게 트리거를 좁힌다.
      DROP TRIGGER trg_entries_touch_updated_at;

      CREATE TRIGGER trg_entries_touch_updated_at
      AFTER UPDATE OF text, normalized, memo ON entries
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE entries SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
    `
  },
  {
    version: 3,
    name: 'remember dismissed links',
    up: `
      -- 자동 연결을 사람이 끊었다는 사실을 남긴다.
      -- 이 기록이 없으면 문장을 고칠 때마다 자동 연결이 다시 계산되면서
      -- 오탐이라 끊어둔 연결이 되살아난다. 같은 판단을 반복하게 만들지 않는다.
      CREATE TABLE dismissed_links (
        parent_id  INTEGER NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
        child_id   INTEGER NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (parent_id, child_id)
      );
    `
  },
  {
    version: 4,
    name: 'give tags a body',
    up: `
      -- 태그도 설명과 링크를 담을 수 있어야 한다.
      -- "왜 이 태그로 묶었는가"는 항목 어디에도 적을 자리가 없었다.
      ALTER TABLE tags ADD COLUMN memo TEXT NOT NULL DEFAULT '';
    `
  }
]
