<script setup lang="ts">
import { watch, ref } from 'vue';
import IconGithub from '~icons/mdi/github';
import IconEmail from '~icons/ic/outline-email';
import IconRefresh from '~icons/carbon/renew';

import { useStore } from './logic';

const { receivers, fetch } = useStore();

const preview = ref('');
const md = ref('');
const update = (preview: string) => {
  fetch(preview).then((r) => {
    md.value = r.content;
  });
};
watch(preview, update, { immediate: true });
</script>

<template>
  <nav>
    <div class="w-full h-full text-gray-700 flex justify-between items-center">
      <div class="inline-block" v-if="preview">
        <span class="font-bold mr-2 select-none">Receiver</span>
        <span id="receiver">{{ preview }}</span>
      </div>
      <div class="inline-block" v-else>
        <span class="font-bold">Vite Email</span>
      </div>

      <div class="inline-block">
        <button title="Template" @click="preview = ''" class="icon-btn text-lg">
          <IconEmail></IconEmail>
        </button>
        <button title="Refresh" @click="update(preview)" class="icon-btn text-lg">
          <IconRefresh></IconRefresh>
        </button>
        <a
          class="icon-btn text-lg px-[6px]"
          href="https://github.com/yjl9903/vite-email"
          target="_blank"
        >
          <IconGithub></IconGithub>
        </a>
      </div>
    </div>
  </nav>
  <div id="main" class="font-none">
    <div id="sidebar" class="h-full border-0 border-r min-w-48 overflow-auto">
      <div v-for="r in receivers" @click="preview = r.receiver">{{ r.receiver }}</div>
    </div>
    <div
      v-html="md"
      id="email"
      :class="['h-[calc(100%-2rem)]', 'flex-grow', 'text-base', 'p-4', 'overflow-auto']"
    ></div>
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}

a {
  text-decoration: none;
  color: inherit;
}
a:active {
  text-decoration: none;
}

.font-none {
  font-size: 0;
}

nav {
  @apply px-6 border-0 border-b gap-4 h-54px children:my-auto;
  border-color: rgba(156, 163, 175, 0.3);
}

.btn {
  @apply px-4 py-1 rounded inline-block
    bg-teal-600 text-white cursor-pointer
    hover:bg-teal-700
    disabled:cursor-default disabled:bg-gray-600 disabled:opacity-50;
}

.icon-btn {
  @apply inline-block cursor-pointer select-none !outline-none !border-none !bg-transparent;
  @apply opacity-75 transition duration-200 ease-in-out;
  @apply hover:opacity-100 hover:text-teal-600;
  font-size: 0.9em;
  height: 1.2em;
}

#main {
  @apply h-[calc(100vh-55px)] flex;
}

#receiver {
  font-weight: lighter;
}

#sidebar {
  border-color: rgba(156, 163, 175, 0.3);
}

#sidebar > div {
  @apply block border-0 border-b px-6 py-2 text-left font-mono text-sm;
  @apply cursor-pointer underline-transparent;
  @apply hover:bg-light-400;
  border-color: rgba(156, 163, 175, 0.3);
}

/* Selection */
::-webkit-selection {
  background-color: #cce2ff;
}
::-moz-selection {
  background-color: #cce2ff;
}
::selection {
  background-color: #cce2ff;
}
input::-webkit-selection,
textarea::-webkit-selection {
  background-color: rgba(100, 100, 100, 0.4);
  color: rgba(0, 0, 0, 0.87);
}
input::-moz-selection,
textarea::-moz-selection {
  background-color: rgba(100, 100, 100, 0.4);
  color: rgba(0, 0, 0, 0.87);
}
input::selection,
textarea::selection {
  background-color: rgba(100, 100, 100, 0.4);
  color: rgba(0, 0, 0, 0.87);
}

/* Scrollbar */
body ::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 8px;
  height: 8px;
}
body ::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}
body ::-webkit-scrollbar-thumb {
  cursor: pointer;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.25);
  transition: color 0.2s ease;
}
body ::-webkit-scrollbar-thumb:window-inactive {
  background: rgba(0, 0, 0, 0.15);
}
body ::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 135, 139, 0.8);
}
</style>
