const LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    paths: [
      <rect key="a" x="3" y="3" width="18" height="18" rx="5" />,
      <circle key="b" cx="12" cy="12" r="4" />,
      <circle key="c" cx="17.5" cy="6.5" r="1" />
    ]
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    paths: [
      <circle key="a" cx="12" cy="12" r="9" />,
      <path key="b" d="M13.2 20.5v-6.8h2.2l.4-2.7h-2.6v-1.7c0-.8.2-1.3 1.3-1.3h1.4V5.5a12 12 0 0 0-2-.2c-2 0-3.4 1.2-3.4 3.4v1.9H8.3v2.7h2.2v6.8" />
    ]
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/',
    paths: [
      <path key="a" d="M16 3v9.5a3.5 3.5 0 1 1-3.5-3.5" />,
      <path key="b" d="M16 3c.5 2.5 2.2 4.2 4.5 4.5" />
    ]
  }
]

export function SocialLinks() {
  return (
    <ul className="flex gap-2">
      {LINKS.map(({ label, href, paths }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${label} (opens in a new tab)`}
            className="grid size-8 place-items-center rounded-full bg-secondary text-white transition-colors hover:bg-primary"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{paths}</svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
