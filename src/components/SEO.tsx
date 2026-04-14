import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://www.electrogrid.ng'
const DEFAULT_IMAGE = `${SITE_URL}/images/logo.png`

type SEOProps = {
  title: string
  description: string
  path?: string
  image?: string
  noindex?: boolean
}

export function SEO({ title, description, path = '/', image = DEFAULT_IMAGE, noindex = false }: SEOProps) {
  const url = `${SITE_URL}${path}`
  const fullTitle = title.includes('ElectroGrid') ? title : `${title} | ElectroGrid`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
