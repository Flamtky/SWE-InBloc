<script>
	import LoginForm from "$lib/loginform.svelte";
	import CreateProfileForm from "$lib/createprofile_form.svelte";

	import { goto } from '$app/navigation';
	import { loggedin_user, local_user_data, firstLogin } from '$lib/stores.js';
	import { browser } from '$app/env';

	let local_data;
    if(browser && !local_data){
        local_data = JSON.parse($local_user_data);
    }

	

</script>
<body>
	{#if !local_data}
		{#if !$firstLogin}
		<LoginForm/>
		{:else}
		<CreateProfileForm/>
		{/if}
	<script
		src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
		{:else}
			<script>
				goto('/');
			</script>
		{/if}
</body>
