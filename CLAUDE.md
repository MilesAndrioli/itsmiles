Every time you write some content, make sure to use the humanizer skill you can find in ~/.agents/skills/humanizer

Avoid the CSS class mb-0 for typography if it's the last element, we have a global CSS rule fixing that already.

IMPORTANT: Use **PascalCase** for custom CSS classes to distinguish them from Tailwind utilities at a glance.

Components expose behavior through props, not internal class names. Nest CSS modifiers inside their parent class to reflect the component structure. Keep components concise: no comments (clear prop and class names should be enough), no unnecessary abstractions.
