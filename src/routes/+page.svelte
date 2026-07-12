<script lang="ts">
  import { resolveRoute } from "$app/paths";
</script>

<h1>Welcome to PGP Playground</h1>
<p>Learn PGP from the ground up through interactive challenges.</p>
<p>
  <a href={resolveRoute("/register")}>Get Started</a> or
  <a href={resolveRoute("/login")}>Sign In</a>
</p>
