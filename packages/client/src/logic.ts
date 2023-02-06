import type { Receiver } from 'vite-email';

import { ref } from 'vue';

import { createHotContext, ViteHotContext } from './client';

export function useStore() {
  const template = ref('');

  const receivers = ref<Receiver[]>([]);

  const rendered = ref<Record<string, any>>({});

  let hot = ref<ViteHotContext>();

  createHotContext('/__email').then((_hot) => {
    hot.value = _hot;
    console.log(hot.value);
    hot.value?.send('vite-email:ready', { msg: 'Hey!' });
    hot.value?.on('vite-email:list', (data) => {
      console.log(data.receivers);
      receivers.value.splice(0, receivers.value.length, ...data.receivers);
    });
    hot.value?.on('vite-email:template', (data) => {
      console.log(data.template);
      template.value = data.template;
      rendered.value = {};
    });
  });

  return {
    template,
    receivers,
    rendered,
    async fetch(receiver: string) {
      hot.value?.send('vite-email:query', { receiver });
      hot.value?.on('vite-email:rendered', (data) => {
        rendered.value[data.receiver.receiver] = data;
      });
    }
  };
}
