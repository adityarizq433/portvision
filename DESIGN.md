# PortVision - Design Direction

## Identity
PortVision is an internal NOC operations dashboard for switch and port monitoring via LibreNMS. It is a working tool, not a public marketing site. The design must read as precise, calm, and operational at a glance during 24/7 shifts.

## Audience
NOC operators and admins (Indonesian language, desktop-first in the office, tablet-safe on site). Primary tasks: check device/port health, open topology, manage locations and operators.

## Personality
Calm under pressure, factual, utilitarian. No hype, no decoration for its own sake. Every element earns its place by helping an operator decide faster.

## Dial
ENERGY 1 / RHYTHM 1 / MOTION 1

- ENERGY 1: Linear-style calm. The interface whispers, it does not shout. One clear status signal per screen.
- RHYTHM 1: Uniform grid and predictable sections. Operators learn positions once and reuse them every shift.
- MOTION 1: Hover and state transitions only. Motion communicates status (polling, pulse on down) and never performs.

## Palette (kept as-is)
- Primary: #1E55F0 (actions, active nav, links). Darker: #1537AB.
- Navy: #1E2D4F (headings, body text, logo).
- Page: #EEEFEF, Card: #FFFFFF, Border: #E5E7EB.
- Text: main #1E2D4F, muted #6B7280, x-muted #9CA3AF.
- Status (only functional accent): up #16A34A on #DCFCE7, down #DC2626 on #FEE2E2, warn #D97706 on #FEF3C7.
- Tier: core #8E4BAA, distribution #6F9BC8, access #4A7F7A.
- Rule: 2-3 core colors + 1 accent. Status colors are the accent system; never add marketing colors, gradients, or glow as decoration.

Dark mode ships with the same semantics on navy-slate (#0b0f17 page, #1e293b card). Both themes must pass AA and keep identical hierarchy.

## Typography
- UI sans: Inter (fallback Figtree, ui-sans-serif). Body and headings.
- Mono: JetBrains Mono for operational data only (hostnames, IPs, counts, timestamps).
- Scale is functional: H1 18px bold for the current page, section labels 12px uppercase tracking-widest, data 13-14px. No display type, no terminal aesthetic for decoration.

## Layout and Composition
- Shell: fixed left sidebar (240px), sticky topbar, content with 24-28px padding, footer with version/source.
- One focal point per screen: the KPI row on Dashboard, the canvas on Topology, the table on list pages. Everything else defers.
- Cards and tables carry the work. No bento mosaic, no hero, no trusted-by bar, no pricing, no template footer. Section order follows the operator workflow, not a marketing template.
- Density is uniform (RHYTHM 1): cards 14px radius, 1px border, soft shadow as elevation only, tables with 12-16px cell padding.

## Levers (how the dials become decisions)
- One focal point per screen: KPI, canvas, or table dominates; secondary panels are visually quieter.
- Hierarchical contrast: size, weight, and status color separate levels on purpose.
- Whitespace as structure: gaps separate sections; empty space is planned, not leftover.
- One deliberate accent: status color marks the one thing that needs attention (down, critical, polling). Everything else stays neutral.
- Identity motif: pill status + tier badge + mono data numbers, repeated consistently so the product feels owned.

## Icons, Badges, Motion
- Icons are inline SVG, relevant to the task (server, map, pin, cog). No sparkle, magic, or generic glyph icon sets. Decorative icons are aria-hidden; meaningful ones carry labels.
- Badges exist only for real state: UP/DOWN/WARN, CORE/DISTRIBUTION/ACCESS, ADMIN/VIEWER, NOC LIVE. Never AI Powered, Beta, New, or Fast without a real meaning.
- Motion is for status and feedback only: dot-blink and alarm pulse for down/critical, spin for polling. All infinite motion stops under prefers-reduced-motion. No fade-up-everything, no bounce solap, no parallax.

## Content and Copy Rules
- Indonesian operational copy, specific and short. CTAs name the action and the object: Sinkronisasi Perangkat, Buka Peta Topologi, Simpan Wilayah, Poll Port. Never Get Started, Learn More, Explore.
- No marketing buzzwords, no fake statistics, no fabricated testimonials or compliance claims.
- Every data view ships empty, loading, and error states. No empty section filled with invented content.
- Navigation only contains real destinations. A feature without a page does not appear in nav.

## What This Is Not
Not a landing page, not a public product site, not a clone of Linear, Vercel, Stripe, or Notion. If the logo were swapped, the NOC workflow should still feel like ours.
