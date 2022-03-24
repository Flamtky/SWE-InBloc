<script>
	import { goto } from '$app/navigation';
	import { loggedin_user, local_user_data, firstLogin } from '$lib/stores.js';
	import { browser } from '$app/env';
	import { page } from '$app/stores';
	import '$lib/firebase.js';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';

	export let id = null;
	export let wall = null;
	export let route = null;
	let comments = null;

	async function load() {
		if (getAuth().currentUser) {
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(
				`https://flamtkzx.flamtky.dev/routes/${route}/comments?gymId=${id}&wallId=${wall}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				}
			);
			if (res.ok) {
				let json = await res.json();
				let temp_comments = Object.entries(json.data.comments);
				for (const uuid of temp_comments) {
					res = await fetch(`https://flamtkzx.flamtky.dev/users/${uuid[0]}`, {
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`
						}
					});
					if (res.ok) {
						let json = await res.json();
						let username = json.data.user.username;
                        uuid[0] = username;
						console.log(username);
					}
				}
                comments = temp_comments;
			}
		}
	}

	onAuthStateChanged(getAuth(), async (user) => {
		if (user) {
			if (!comments) {
				await load();
			}
		} else {
			comments = null;
		}
	});
</script>



<div class="container d-xl-flex flex-column justify-content-xl-start" style="width: 600px;">
	<h1 class="d-xl-flex justify-content-xl-start">Comments</h1>
	<hr />
    {#if comments}
    {#each comments as comment}
	<div class="d-xl-flex flex-column justify-content-xl-center align-items-xl-start">
		<span class="d-xl-flex">{comment[0]}</span><small class="text-muted"> {new Date(parseInt(comment[1].timestamp)).toLocaleString()}</small>
        <textarea
			class="d-xl-flex"
			type="text"
			style="height: 90px;width: 100%;margin-bottom: 10px;resize: none; cursor: default;"
            bind:value={comment[1].message}
            readonly
		/>
	</div>
    {/each}
    {/if}
</div>