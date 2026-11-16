# CLAUDE.md

Read `README.md` before every task and follow its "Working with Claude" rules. In short:

- Use the Impeccable plugin for all UI work: `/impeccable shape` before building, `/impeccable critique` and `/impeccable audit` after.
- Never write code comments.
- Never use placeholder images. Use the client's real photos, or credited Unsplash or Pexels stock photos until the client's photos arrive.
- Use glassmorphism as the visual style for floating and overlay UI. Glassmorphism is a visual design style that mimics frosted glass by combining semi-transparency, background blur, and subtle light borders to create depth.
  - Use the `.glass`, `.glass-strong` and `.glass-dark` classes in `src/index.css`. Don't hand-roll blur and transparency on individual components.
  - Apply glass to surfaces that sit over photos or color: the navbar, search bar, photo captions and chips, the mobile menu, dialogs, toasts and sticky bars.
  - Keep data-dense surfaces solid: tables, calendars, forms, stat blocks and price breakdowns.
  - Text on glass must still meet 4.5:1 contrast. Raise the opacity before lowering the text contrast.
  - Don't stack glass on glass, and keep every glass surface backed by a solid fallback.
  - See "Glass" in `DESIGN.md` for the full tokens and rules.
- Check the "Definition of done" in `README.md` before finishing any task.
