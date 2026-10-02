import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * MEAN OLD TIM: /book page
 *
 * Single code component that renders the full booking page.
 * Responsive via its own media queries (viewport based):
 *   Desktop  >= 1200  two columns (5/7), left hero sticky
 *   Tablet   810-1199 single column, max width 640, centered
 *   Mobile   < 810    single column, 20px gutters, sticky bottom CTA bar
 *
 * Place it on the /book page at Width: Fill (1fr), Height: Fit (auto),
 * in a stack or frame with overflow visible (sticky needs it).
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */

type Props = {
    eyebrow: string
    heading: string
    intro: string

    checklistHeading: string
    checklistItems: string[]

    ctaLabel: string
    ctaLink: string
    ctaHelper: string
    dmPrefix: string
    instagramLabel: string
    instagramLink: string
    dmJoiner: string
    dmEmail: string

    nextHeading: string
    nextBody: string[]

    studioName: string
    studioAddress: string
    studioPhone: string
    studioEmail: string
    mapLabel: string
    mapLink: string

    stickyTop: number
    showMobileBar: boolean
    loadFonts: boolean

    red: string
    ink: string
    bone: string

    displayFont: string
    bodyFont: string
    uiFont: string

    h1Desktop: number
    h1Tablet: number
    h1Mobile: number

    style?: React.CSSProperties
}

const telHref = (phone: string) => {
    const digits = phone.replace(/[^\d]/g, "")
    return digits.length === 10 ? `tel:+1${digits}` : `tel:${digits}`
}

const pad = (n: number) => String(n).padStart(2, "0")

const css = `
.mot-book, .mot-book * { box-sizing: border-box; border-radius: 0; }
.mot-book {
    width: 100%;
    background: var(--mot-ink);
    color: var(--mot-bone);
    font-family: var(--mot-body);
    -webkit-font-smoothing: antialiased;
    overflow-x: clip;
}
.mot-book a { color: inherit; }
.mot-book a:focus-visible,
.mot-book button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
}

/* Layout */
.mot-main {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 40px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 120px 40px 160px;
}
.mot-hero {
    container-type: inline-size;
    grid-column: 1 / span 5;
    align-self: start;
    position: sticky;
    top: var(--mot-sticky-top);
}
.mot-content {
    grid-column: 6 / span 7;
    display: flex;
    flex-direction: column;
    gap: 96px;
    padding-left: 40px;
}

/* Type */
.mot-eyebrow {
    margin: 0 0 24px;
    font-family: var(--mot-ui);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.7;
}
.mot-h1, .mot-h2 {
    margin: 0;
    font-family: var(--mot-display);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: -0.01em;
}
.mot-h1 {
    /* Capped by hero width so the longest word never overflows its column */
    font-size: min(var(--mot-h1-d), 13cqi);
    line-height: 0.92;
    overflow-wrap: break-word;
}
.mot-h2 {
    font-size: 40px;
    line-height: 1;
    margin-bottom: 32px;
}
.mot-body {
    margin: 0;
    font-family: var(--mot-body);
    font-size: 20px;
    line-height: 1.5;
}
.mot-hero .mot-body { margin-top: 32px; max-width: 30ch; }
.mot-body + .mot-body { margin-top: 20px; }

/* Numbered checklist */
.mot-list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid color-mix(in srgb, var(--mot-bone) 20%, transparent);
}
.mot-item {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid color-mix(in srgb, var(--mot-bone) 20%, transparent);
}
.mot-num {
    font-family: var(--mot-ui);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.04em;
    line-height: 1.9;
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
}
.mot-item .mot-body { font-size: 20px; }

/* CTA */
.mot-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 60px;
    padding: 0 40px;
    background: var(--mot-red);
    color: var(--mot-bone) !important;
    font-family: var(--mot-ui);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
    transition: filter 150ms ease;
}
.mot-btn:hover { filter: brightness(1.12); }
.mot-helper {
    margin: 16px 0 0;
    font-family: var(--mot-ui);
    font-size: 14px;
    line-height: 1.5;
    opacity: 0.8;
}
.mot-dm {
    margin: 28px 0 0;
    font-family: var(--mot-body);
    font-size: 18px;
    line-height: 1.5;
}
.mot-dm a {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
}
.mot-dm a:hover { text-decoration-thickness: 2px; }

/* Studio band */
.mot-studio {
    background: var(--mot-bone);
    color: var(--mot-ink);
}
.mot-studio-inner {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 40px;
    row-gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 40px;
}
.mot-studio .mot-h2 {
    grid-column: 1 / -1;
    font-size: 32px;
    margin-bottom: 16px;
}
.mot-studio-col {
    font-family: var(--mot-ui);
    font-size: 16px;
    line-height: 1.6;
    font-style: normal;
}
.mot-studio-col a {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
}
.mot-studio-col a:hover { text-decoration-thickness: 2px; }
.mot-studio-col p { margin: 0; }

/* Mobile sticky bar */
.mot-bar {
    display: none;
}

/* Tablet */
@media (max-width: 1199.98px) {
    .mot-main {
        display: block;
        max-width: 688px;
        padding: 96px 24px 120px;
    }
    .mot-hero { position: static; margin-bottom: 80px; }
    .mot-hero .mot-body { max-width: none; }
    .mot-content { padding-left: 0; gap: 80px; }
    .mot-h1 { font-size: min(var(--mot-h1-t), 13cqi); }
    .mot-studio-inner {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        max-width: 688px;
        padding: 64px 24px;
    }
    .mot-studio-map { grid-column: 1 / -1; }
}

/* Mobile */
@media (max-width: 809.98px) {
    .mot-main { padding: 64px 20px 96px; }
    .mot-hero { margin-bottom: 64px; }
    .mot-content { gap: 64px; }
    .mot-h1 { font-size: min(var(--mot-h1-m), 13cqi); }
    .mot-h2 { font-size: 30px; margin-bottom: 24px; }
    .mot-body, .mot-item .mot-body { font-size: 18px; }
    .mot-item { grid-template-columns: 48px minmax(0, 1fr); gap: 12px; }
    .mot-btn { width: 100%; padding: 0 20px; }
    .mot-studio-inner {
        grid-template-columns: minmax(0, 1fr);
        padding: 56px 20px;
    }
    .mot-studio .mot-h2 { font-size: 26px; }
    .mot-book[data-bar="on"] .mot-studio-inner {
        padding-bottom: calc(56px + 84px + env(safe-area-inset-bottom, 0px));
    }
    .mot-book[data-bar="on"] .mot-bar {
        display: block;
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        padding: 12px 20px calc(12px + env(safe-area-inset-bottom, 0px));
        background: var(--mot-ink);
        border-top: 1px solid color-mix(in srgb, var(--mot-bone) 20%, transparent);
        transition: transform 200ms ease, visibility 200ms;
    }
    .mot-book[data-bar="on"] .mot-bar[data-hidden="true"] {
        transform: translateY(100%);
        visibility: hidden;
    }
}

@media (prefers-reduced-motion: reduce) {
    .mot-btn, .mot-bar { transition: none !important; }
}
`

export default function BookPage(props: Props) {
    const {
        eyebrow,
        heading,
        intro,
        checklistHeading,
        checklistItems,
        ctaLabel,
        ctaLink,
        ctaHelper,
        dmPrefix,
        instagramLabel,
        instagramLink,
        dmJoiner,
        dmEmail,
        nextHeading,
        nextBody,
        studioName,
        studioAddress,
        studioPhone,
        studioEmail,
        mapLabel,
        mapLink,
        stickyTop,
        showMobileBar,
        loadFonts,
        red,
        ink,
        bone,
        displayFont,
        bodyFont,
        uiFont,
        h1Desktop,
        h1Tablet,
        h1Mobile,
        style,
    } = props

    // Hide the mobile bar while the in-page CTA is on screen, so only one
    // red button is ever visible.
    const ctaRef = React.useRef<HTMLAnchorElement>(null)
    const [ctaVisible, setCtaVisible] = React.useState(false)
    React.useEffect(() => {
        const el = ctaRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            ([entry]) => setCtaVisible(entry.isIntersecting),
            { threshold: 0.01 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    const vars = {
        "--mot-red": red,
        "--mot-ink": ink,
        "--mot-bone": bone,
        "--mot-display": `"${displayFont}", "Clash Display", Impact, sans-serif`,
        "--mot-body": `"${bodyFont}", Newsreader, Georgia, serif`,
        "--mot-ui": `"${uiFont}", Inter, system-ui, sans-serif`,
        "--mot-sticky-top": `${stickyTop}px`,
        "--mot-h1-d": `${h1Desktop}px`,
        "--mot-h1-t": `${h1Tablet}px`,
        "--mot-h1-m": `${h1Mobile}px`,
    } as React.CSSProperties

    const external = { target: "_blank", rel: "noopener noreferrer" }

    return (
        <div
            className="mot-book"
            data-bar={showMobileBar ? "on" : "off"}
            style={{ ...vars, ...style }}
        >
            {loadFonts && (
                <>
                    <link
                        rel="stylesheet"
                        href="https://api.fontshare.com/v2/css?f[]=clash-display@600&display=swap"
                    />
                    <link
                        rel="stylesheet"
                        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap"
                    />
                </>
            )}
            <style>{css}</style>

            <main className="mot-main">
                <header className="mot-hero">
                    <p className="mot-eyebrow">{eyebrow}</p>
                    <h1 className="mot-h1">{heading}</h1>
                    <p className="mot-body">{intro}</p>
                </header>

                <div className="mot-content">
                    <section aria-labelledby="mot-checklist">
                        <h2 id="mot-checklist" className="mot-h2">
                            {checklistHeading}
                        </h2>
                        <ol className="mot-list">
                            {checklistItems.map((item, i) => (
                                <li className="mot-item" key={i}>
                                    <span className="mot-num" aria-hidden="true">
                                        {pad(i + 1)}/
                                    </span>
                                    <span className="mot-body">{item}</span>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section aria-label={ctaLabel}>
                        <a
                            ref={ctaRef}
                            className="mot-btn"
                            href={ctaLink}
                            {...external}
                        >
                            {ctaLabel}
                        </a>
                        <p className="mot-helper">{ctaHelper}</p>
                        <p className="mot-dm">
                            {dmPrefix}{" "}
                            <a href={instagramLink} {...external}>
                                {instagramLabel}
                            </a>{" "}
                            {dmJoiner}{" "}
                            <a href={`mailto:${dmEmail}`}>{dmEmail}</a>
                        </p>
                    </section>

                    <section aria-labelledby="mot-next">
                        <h2 id="mot-next" className="mot-h2">
                            {nextHeading}
                        </h2>
                        {nextBody.map((para, i) => (
                            <p className="mot-body" key={i}>
                                {para}
                            </p>
                        ))}
                    </section>
                </div>
            </main>

            <section className="mot-studio" aria-labelledby="mot-studio">
                <div className="mot-studio-inner">
                    <h2 id="mot-studio" className="mot-h2">
                        {studioName}
                    </h2>
                    <address className="mot-studio-col">
                        <p>{studioAddress}</p>
                    </address>
                    <div className="mot-studio-col">
                        <p>
                            <a href={telHref(studioPhone)}>{studioPhone}</a>
                        </p>
                        <p>
                            <a href={`mailto:${studioEmail}`}>{studioEmail}</a>
                        </p>
                    </div>
                    <div className="mot-studio-col mot-studio-map">
                        <p>
                            <a href={mapLink} {...external}>
                                {mapLabel}
                            </a>
                        </p>
                    </div>
                </div>
            </section>

            {showMobileBar && (
                <div
                    className="mot-bar"
                    data-hidden={ctaVisible ? "true" : "false"}
                    aria-hidden={ctaVisible ? "true" : undefined}
                >
                    <a
                        className="mot-btn"
                        href={ctaLink}
                        tabIndex={ctaVisible ? -1 : undefined}
                        {...external}
                    >
                        {ctaLabel}
                    </a>
                </div>
            )}
        </div>
    )
}

const ADDRESS = "403 NE 45th Street, Seattle, WA 98105"

BookPage.defaultProps = {
    eyebrow: "BOOKING",
    heading: "BOOK A CONSULTATION",
    intro: "Tell me what you want, where it goes, and how big. I'll take it from there.",

    checklistHeading: "WHAT TO SEND ME",
    checklistItems: [
        "Your idea, as detailed as you can get",
        "Placement and rough size",
        "Color or black and grey (or not sure)",
        "Reference images",
        "Dates you're available, especially if you're traveling in",
    ],

    ctaLabel: "START YOUR REQUEST",
    ctaLink: "https://slavetotheneedle.com/book-tattoo/",
    ctaHelper: "Select Wallingford, then Tim Bradley.",
    dmPrefix: "Prefer DMs?",
    instagramLabel: "Instagram",
    instagramLink: "https://www.instagram.com/meanoldtim/",
    dmJoiner: "or",
    dmEmail: "meanoldtim@gmail.com",

    nextHeading: "AFTER YOU REACH OUT",
    nextBody: [
        "We talk through your concept and find a direction together. The shop takes your deposit and gets you on the books.",
        "Traveling to see me? Same process, except I handle the deposit and scheduling directly.",
    ],

    studioName: "Slave to the Needle, Wallingford",
    studioAddress: ADDRESS,
    studioPhone: "206-545-3685",
    studioEmail: "sttntattoo@gmail.com",
    mapLabel: "Open in Google Maps",
    mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        "Slave to the Needle, " + ADDRESS
    )}`,

    stickyTop: 120,
    showMobileBar: true,
    loadFonts: true,

    red: "#C13B2E",
    ink: "#0F0E0D",
    bone: "#E8E4DC",

    displayFont: "Clash Display",
    bodyFont: "Newsreader",
    uiFont: "Inter",

    h1Desktop: 56,
    h1Tablet: 48,
    h1Mobile: 40,
}

const d = BookPage.defaultProps

addPropertyControls(BookPage, {
    // Hero
    eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: d.eyebrow },
    heading: { type: ControlType.String, title: "H1", defaultValue: d.heading },
    intro: {
        type: ControlType.String,
        title: "Intro",
        displayTextArea: true,
        defaultValue: d.intro,
    },

    // Checklist
    checklistHeading: {
        type: ControlType.String,
        title: "Checklist H2",
        defaultValue: d.checklistHeading,
    },
    checklistItems: {
        type: ControlType.Array,
        title: "Checklist",
        control: { type: ControlType.String },
        defaultValue: d.checklistItems,
    },

    // CTA
    ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: d.ctaLabel },
    ctaLink: { type: ControlType.Link, title: "CTA Link", defaultValue: d.ctaLink },
    ctaHelper: { type: ControlType.String, title: "CTA Helper", defaultValue: d.ctaHelper },
    dmPrefix: { type: ControlType.String, title: "DM Prefix", defaultValue: d.dmPrefix },
    instagramLabel: {
        type: ControlType.String,
        title: "IG Label",
        defaultValue: d.instagramLabel,
    },
    instagramLink: { type: ControlType.Link, title: "IG Link", defaultValue: d.instagramLink },
    dmJoiner: { type: ControlType.String, title: "DM Joiner", defaultValue: d.dmJoiner },
    dmEmail: { type: ControlType.String, title: "DM Email", defaultValue: d.dmEmail },

    // Next steps
    nextHeading: { type: ControlType.String, title: "Next H2", defaultValue: d.nextHeading },
    nextBody: {
        type: ControlType.Array,
        title: "Next Body",
        control: { type: ControlType.String, displayTextArea: true },
        defaultValue: d.nextBody,
    },

    // Studio
    studioName: { type: ControlType.String, title: "Studio Name", defaultValue: d.studioName },
    studioAddress: {
        type: ControlType.String,
        title: "Address",
        defaultValue: d.studioAddress,
    },
    studioPhone: { type: ControlType.String, title: "Phone", defaultValue: d.studioPhone },
    studioEmail: { type: ControlType.String, title: "Studio Email", defaultValue: d.studioEmail },
    mapLabel: { type: ControlType.String, title: "Map Label", defaultValue: d.mapLabel },
    mapLink: { type: ControlType.Link, title: "Map Link", defaultValue: d.mapLink },

    // Behavior
    stickyTop: {
        type: ControlType.Number,
        title: "Sticky Top",
        min: 0,
        max: 400,
        step: 4,
        unit: "px",
        defaultValue: d.stickyTop,
    },
    showMobileBar: {
        type: ControlType.Boolean,
        title: "Mobile Bar",
        defaultValue: d.showMobileBar,
    },
    loadFonts: {
        type: ControlType.Boolean,
        title: "Load Fonts",
        description: "Loads Clash Display, Newsreader and Inter from CDN.",
        defaultValue: d.loadFonts,
    },

    // Colors (bind these to the project's color styles)
    red: { type: ControlType.Color, title: "Red", defaultValue: d.red },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: d.ink },
    bone: { type: ControlType.Color, title: "Bone", defaultValue: d.bone },

    // Type
    displayFont: { type: ControlType.String, title: "Display Font", defaultValue: d.displayFont },
    bodyFont: { type: ControlType.String, title: "Body Font", defaultValue: d.bodyFont },
    uiFont: { type: ControlType.String, title: "UI Font", defaultValue: d.uiFont },
    h1Desktop: { type: ControlType.Number, title: "H1 Desktop", min: 24, max: 200, unit: "px", defaultValue: d.h1Desktop },
    h1Tablet: { type: ControlType.Number, title: "H1 Tablet", min: 24, max: 200, unit: "px", defaultValue: d.h1Tablet },
    h1Mobile: { type: ControlType.Number, title: "H1 Mobile", min: 24, max: 200, unit: "px", defaultValue: d.h1Mobile },
})
