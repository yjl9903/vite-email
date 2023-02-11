<script setup lang="ts">
import { computed, watch, ref } from 'vue';

import 'vite-email.css';

import { useStore } from './logic';

const { template, receivers, rendered, fetch } = useStore();

const preview = ref('');

const update = (preview: string) => {
  fetch(preview);
};

const receiver = computed(() => {
  if (preview.value in rendered.value) {
    return rendered.value[preview.value].receiver;
  } else {
    return undefined;
  }
});
const content = computed(() => {
  if (preview.value in rendered.value) {
    console.log(rendered.value[preview.value].content);
    return rendered.value[preview.value];
  } else {
    if (preview.value !== '') {
      update(preview.value);
    }
    return { content: template.value };
  }
});

watch(preview, update);
</script>

<template>
  <nav class="w-screen h-[60px] flex justify-between items-center font-sans">
    <div flex items-center gap2 select-none>
      <span i-ic-outline-email text-xl></span>
      <span class="font-bold text-xl cursor-pointer" @click="preview = ''">Vite Email</span>
    </div>

    <div flex gap2 items-center>
      <span i-ic-outline-email text-xl @click="preview = ''" class="icon-btn"></span>
      <span i-carbon-renew text-xl @click="update(preview)" class="icon-btn"></span>
      <a
        href="https://github.com/yjl9903/vite-email"
        target="_blank"
        i-carbon-logo-github
        text-xl
        class="icon-btn"
      ></a>
    </div>
  </nav>

  <div id="main" class="flex font-sans">
    <div id="sidebar" border="r-1 base" class="h-full min-w-48 overflow-auto">
      <div
        v-for="r in receivers"
        @click="preview = r.receiver"
        :class="preview === r.receiver && 'bg-light-400'"
      >
        <span>{{ r.receiver }}</span>
      </div>
    </div>
    <div flex-auto class="h-full">
      <div v-if="receiver" border="b-1 base" p4 class="bg-gray-100/50 space-y-1">
        <div space-x-2>
          <span font-bold inline-block w-28 select-none>Title</span>
          <span>{{ receiver.title ?? content.subject }}</span>
        </div>
        <div space-x-2>
          <span font-bold inline-block w-28 select-none>Receiver</span>
          <a underline :href="`mailto:${receiver.receiver}`">{{ receiver.receiver }}</a>
        </div>
        <div space-x-2 v-if="receiver.attachments.length > 0">
          <span font-bold inline-block w-28 select-none>Attachment</span>
          <span v-for="attach in receiver.attachment">{{ attach }}</span>
        </div>
        <div space-x-2>
          <span font-bold inline-block w-28 select-none>Frontmatter</span>
          <span text-base-600>{{ JSON.stringify(receiver.frontmatter) }}</span>
        </div>
      </div>
      <div :class="['flex-grow', 'text-base-900', 'px4', 'overflow-auto']">
        <div v-html="content.content" id="email" class="my2"></div>
      </div>
    </div>
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
  @apply inline-block cursor-pointer select-none !outline-none !border-none;
  @apply transition duration-200 ease-in-out;
}

#main {
  height: calc(100vh - 60px);
}

#receiver {
  font-weight: lighter;
}

#sidebar > div {
  @apply block border-0 border-b px-6 py-2 text-left font-mono text-sm;
  @apply cursor-pointer underline-transparent select-none;
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
