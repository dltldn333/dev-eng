/**
 * 표기 흔들림을 없애서 중복 등록과 자동 연결의 기준으로 삼는 문자열을 만든다.
 * 소문자화 → 어포스트로피 정리 → 구두점 제거 → 공백 정리.
 *
 * 어포스트로피는 지우지 않고 남긴다. "don't" 를 "dont" 로 만들면 원형을 잃는다.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
