import type { Receiver } from 'vite-email';

import { ref } from 'vue';

export function useStore() {
  const receivers = ref<Receiver[]>([]);

  if (window.sessionStorage.getItem('receivers')) {
    receivers.value = JSON.parse(window.sessionStorage.getItem('receivers')!);
  } else {
    fetch('/__email_list')
      .then((res) => res.json())
      .then((res) => {
        window.sessionStorage.setItem('receivers', JSON.stringify(res));
        receivers.value = res;
      });
  }

  return {
    receivers,
    async fetch(receiver: string): Promise<{ content: string; subject: string }> {
      return fetch(`/__email_api?r=${receiver}`).then((res) => res.json());
    }
  };
}
