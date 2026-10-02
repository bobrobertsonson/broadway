# MEAN OLD TIM /book page (Framer code component)

`BookPage.tsx` renders the whole /book page: hero, checklist, CTA, next steps, studio band, mobile sticky CTA bar.

## Add it to Framer
1. Assets panel > Code > `+` > New component file. Name it `BookPage`.
2. Replace the file contents with `BookPage.tsx` and save.
3. Pages > `+` > New page. Set the path to `/book`.
4. Drag `BookPage` onto the page. Width: Fill. Height: Fit. Make sure no parent has overflow Hidden/Clip (it breaks the sticky hero) and no parent has a transform or appear effect (it breaks the fixed mobile bar).
5. Page settings > SEO:
   - Title: `Book a Tattoo Consultation | Mean Old Tim, Seattle`
   - Description: `Book a Japanese-style tattoo consultation with Tim Bradley (Mean Old Tim) at Slave to the Needle in Wallingford, Seattle.`
6. In the component's properties, bind Red / Ink / Bone to your project color styles.
7. If the site already loads Clash Display, Newsreader and Inter on this page, turn off "Load Fonts".
8. Repoint every "Book a consultation" / "Book now" link on the site to the `/book` page.

Layout uses viewport media queries (1200 / 810), so check breakpoints in Preview or on the published site. The canvas will not switch layouts.
