<script context="module">
	import '$lib/firebase.js';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	import { loggedin_user, local_user_data } from '$lib/stores.js';
	import { browser } from '$app/env';
	

	export async function load() {
		if (getAuth().currentUser) {
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch('http://localhost:1337/gyms', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});
			let json = await res.json();
			let data = json.data;
			let gyms = Object.entries(data.gyms);
			if (res.ok) {
				return {
					props: {
						gyms
					}
				};
			} else {
				return {
					status: res.status,
					error: new Error('Error loading data')
				};
			}
		} else {
			let gyms = null;
			return {
				props: {
					gyms
				}
			};
		}
	}
</script>

<script>
	import Card from '$lib/hallen_card.svelte';
	//Here would be the onSnapshot message to gather realtime Data from the database
	// First fetch should be in the script context="module" tags
	export let gyms;
    let errorMessage = "";
    onAuthStateChanged(getAuth(),async (user) => {
		if (user) {
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch('http://localhost:1337/gyms', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});
			let json = await res.json();
			let data = json.data;
			let recived_gyms = Object.entries(data.gyms);
            if(res.ok){
                gyms = recived_gyms;
            }else{
                if(res.status === 403){
                    errorMessage = "Du bist nicht authorisiert";
                }
            }
		}
	});

</script>

<div class="container">
	<form class="d-flex me-auto navbar-form" target="_self">
		<div class="d-flex align-items-center">
			<label class="form-label d-flex mb-0" for="search-field" /><input
				class="form-control search-field"
				type="search"
				id="search-field"
				name="search"
				style="filter: blur(0px);"
			/><i class="fa fa-search" />
		</div>
	</form>
	{#if gyms != null}
		{#each gyms as gym}
			<Card
				name={gym[1].name}
				desc={gym[1].description}
				adresse={gym[1].city + ' ' + gym[1].street + ' ' + gym[1].houseNumber}
			/>
		{/each}
	{/if}
</div>
