<template>
  <nav>
    <div class="text-gray-700">
      <span class="font-bold mr-2 select-none">Receiver</span>
      <span id="receiver">yjl9903@vip.qq.com</span>
    </div>
  </nav>
  <div id="main" class="font-none">
    <div id="sidebar" class="h-full border-0 border-r border-gray-400 min-w-48 overflow-auto">
      <a href="/123">1</a>
      <a href="/123">1</a>
      <a href="/123">1</a>
      <a href="/123">1</a>
      <a href="/123">1</a>
      <a href="/123">1</a>
      <a href="/123">1</a>
    </div>
    <div id="email" class="h-[calc(100%-2rem)] flex-grow text-base p-4 overflow-auto">
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
      <h1>123</h1>
    </div>
  </div>
</template>

<style>
.font-none {
  font-size: 0;
}

nav {
  @apply px-6 border-0 border-b border-gray-400 flex gap-4 h-54px children:my-auto;
}

#main {
  @apply h-[calc(100vh-55px)] flex;
}

#receiver {
  font-weight: lighter;
}

#sidebar > a {
  @apply block border-0 border-b px-3 py-2 text-left font-mono text-sm;
  @apply cursor-pointer underline-transparent;
  @apply hover:bg-light-400;
  text-decoration: none;
}
#sidebar > a:active {
  text-decoration: none;
  color: inherit;
}
</style>
