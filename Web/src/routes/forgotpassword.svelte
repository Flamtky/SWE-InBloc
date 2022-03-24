<script>
	import Form from '$lib/forgotpwform.svelte';
    import {local_user_data} from '$lib/stores.js';
    import { browser } from '$app/env';

    let local_data;
	if(browser && !local_data){
        local_data = JSON.parse($local_user_data);
    }

</script>

<body>
    {#if !local_data}
	<Form/>
	<script
		src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        {:else}
            <script>
                window.location.href = '/';
            </script>
        {/if}
</body>

