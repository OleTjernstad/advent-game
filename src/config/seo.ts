import windowContent from '#/data/window-content.json'

/** Site-wide name, shown on every page. */
export const SITE_NAME = 'Julekalender'

/** Geocaching GC code for the associated cache. Fill in once published. */
export const GC_CODE = 'GC123'

export const SITE_TITLE = `${SITE_NAME} (${GC_CODE})`

export const SITE_DESCRIPTION =
  'En digital adventskalender med et lite spill bak hver luke.'

/** Builds a page title, falling back to the site title when none is given. */
export function buildTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} | ${SITE_TITLE}` : SITE_TITLE
}

/** Human-readable title for a calendar day, sourced from the window content. */
export function getDayTitle(day: number): string {
  const content = windowContent.windows.find((w) => w.day === day)
  return content ? `Dag ${day}: ${content.title}` : `Dag ${day}`
}
