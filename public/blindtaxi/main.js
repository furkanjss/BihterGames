(() => {
  const year = document.getElementById('y')
  if (year) year.textContent = String(new Date().getFullYear())

  const nav = document.getElementById('nav')
  const burger = document.querySelector('.nav__burger')
  const links = document.querySelector('.nav__links')

  const onScroll = () => {
    if (!nav) return
    nav.classList.toggle('is-solid', window.scrollY > 24)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  const closeMenu = () => {
    burger?.classList.remove('is-open')
    links?.classList.remove('is-open')
    if (burger) burger.setAttribute('aria-expanded', 'false')
    document.body.style.overflow = ''
  }

  burger?.addEventListener('click', () => {
    const open = !burger.classList.contains('is-open')
    burger.classList.toggle('is-open', open)
    links?.classList.toggle('is-open', open)
    burger.setAttribute('aria-expanded', open ? 'true' : 'false')
    document.body.style.overflow = open ? 'hidden' : ''
  })

  links?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu))

  const nodes = document.querySelectorAll('[data-reveal]')
  if (!nodes.length) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach((el) => el.classList.add('is-in'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        observer.unobserve(entry.target)
      }
    },
    { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
  )

  nodes.forEach((el) => observer.observe(el))
})()
