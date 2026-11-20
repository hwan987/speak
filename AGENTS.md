# Project Agent Guidelines

## Supabase Database & Table Access Rules

앞으로 Supabase PostgreSQL 테이블을 생성하거나 액세스할 때는 아래 규칙을 **항상** 적용해야 합니다.

1. **PostgREST API 접근을 위한 명시적 `GRANT` SQL 포함**
   - `anon` 및 `authenticated` 역할(Role)이 PostgREST API를 통해 테이블에 접근할 수 있도록 명시적인 `GRANT` 문(`SELECT`, `INSERT`, `UPDATE`, `DELETE` 등)을 반드시 포함합니다.
   - 필요 시 스키마(`USAGE ON SCHEMA public`) 및 시퀀스(`USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public`) 권한도 함께 확인합니다.

2. **RLS(Row Level Security) 활성화 및 인증 유저 전용 Policy 작성**
   - 테이블 생성 시 반드시 `ENABLE ROW LEVEL SECURITY`를 실행해 RLS를 활성화합니다.
   - `authenticated` 역할의 인증된 유저만 읽고 쓸 수 있도록 `CREATE POLICY` 문을 함께 작성합니다. (`anon` 역할에는 `GRANT`로 API 스키마 노출을 허용하되, 실제 데이터 읽고 쓰기는 RLS 정책에서 `TO authenticated`로 제한합니다.)

### 기본 SQL 템플릿

```sql
-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.<table_name> (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. PostgREST API 접근을 위한 명시적 GRANT
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO anon, authenticated;

-- 3. RLS 활성화
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- 4. 인증된 유저(authenticated) 전용 읽기/쓰기 Policy
CREATE POLICY "Authenticated users can select"
  ON public.<table_name>
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert"
  ON public.<table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update"
  ON public.<table_name>
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete"
  ON public.<table_name>
  FOR DELETE
  TO authenticated
  USING (true);
```

> 참고: 사용자별 소유 데이터인 경우 `USING (auth.uid() = user_id)` 및 `WITH CHECK (auth.uid() = user_id)` 조건을 적용해 본인 데이터에만 접근하도록 세분화합니다.
