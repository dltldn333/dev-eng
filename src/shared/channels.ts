/** 메인과 프리로드가 같은 문자열을 쓰도록 한곳에 모아둔다. */
export const CHANNELS = {
  entriesList: 'entries:list',
  entriesGet: 'entries:get',
  entriesCreate: 'entries:create',
  entriesUpdate: 'entries:update',
  entriesDelete: 'entries:delete',
  entriesVisit: 'entries:visit',
  linksParents: 'links:parents',
  linksChildren: 'links:children',
  linksCreate: 'links:create',
  linksDelete: 'links:delete'
} as const

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS]
