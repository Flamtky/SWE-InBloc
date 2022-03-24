<script context="module">
	import '$lib/firebase.js';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	import { loggedin_user, local_user_data, firstLogin } from '$lib/stores.js';
	import { browser } from '$app/env';

	export async function load() {
		if (getAuth().currentUser) {
			console.log('ICH LADE VOR');
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let gyms = null;
			let image_urls = {};
			let res = await fetch('https://flamtkzx.flamtky.dev/gyms', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (res.ok) {
				let json = await res.json();
				console.log(json);
				let data = json.data;
				gyms = Object.entries(data.gyms);
				for (const gym of gyms){
					let res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${gym[0]}/logo`, {
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`
						}
					});
					if (res.ok) {
						let json = await res.json();
						let image_url = json.data.logo;
						console.log("Gym: " + gym[0] + " has image: " + image_url);
						image_urls[gym[0]] = image_url;
					} else {
						image_urls[gym[0]] =
							'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.antenneniederrhein.de%2Fexternalimages%2F%3Fsource%3Djpg248%2Fboulderhalle-kleve.jpg%26crop%3D0x125x6000x3750%26resize%3D1280x800%26dt%3D202007130845510&f=1&nofb=1';
					}
				}
				console.log("Preloaded Images: " + Object.entries(image_urls));
			}
			
			return {
					props: {
						gyms,
						image_urls
					}
				};
		} else {
			let gyms = null;
			let image_urls = {};
			return {
				props: {
					gyms,
					image_urls
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
	export let image_urls = {};
	let errorMessage = '';
	let old_gyms = null;

	async function reload(){
		console.log('ICH RELOADE');
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch('https://flamtkzx.flamtky.dev/gyms', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});
			if (res.ok) {
				let json = await res.json();
				let data = json.data;
				let recived_gyms = Object.entries(data.gyms);
				if (!firstLogin == false) {
					gyms = recived_gyms;
				} else {
					if (res.status === 403) {
						errorMessage = 'Du bist nicht authorisiert';
						return;
					}
				}
				console.log(gyms);
				for (const gym of gyms){
					let res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${gym[0]}/logo`, {
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`
						}
					});
					if (res.ok) {
						let json = await res.json();
						let image_url = json.data.logo;
						image_urls[gym[0]] = image_url;
					} else {
						image_urls[gym[0]] =
							'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.antenneniederrhein.de%2Fexternalimages%2F%3Fsource%3Djpg248%2Fboulderhalle-kleve.jpg%26crop%3D0x125x6000x3750%26resize%3D1280x800%26dt%3D202007130845510&f=1&nofb=1';
					}
				}
			}
	}

	let search_string = null;

	function search_gym(){
		console.log('search_gym');
		if(old_gyms == null){
			old_gyms = gyms;
		}
		if (search_string == null || search_string == ''){
			gyms = old_gyms;
		} else {
			gyms = old_gyms;
			let filtered_gyms = [];
			for (const gym of gyms){
				if (gym[1].name.toLowerCase().includes(search_string.toLowerCase())){
					filtered_gyms.push(gym);
				}
			}
			old_gyms = gyms;
			gyms = filtered_gyms;
		}
	}

	onAuthStateChanged(getAuth(), async (user) => {
		if (user) {
			console.log("Images: " + Object.entries(image_urls));
			if(!gyms){
				reload();
			}
		}else{
			gyms = null;
			image_urls = {};
		}
	});
</script>
{#if gyms != null}
<div class="sbar">
	<form
		class="me-auto navbar-form"
		style="display:inline-block; max-width: 20vw; min-width: 180px; margin-top: 1vh;"
		target="_self"
	>
		<div class="d-flex align-items-center">
			<label class="form-label d-flex mb-0" for="search-field" /><input
				class="form-control search-field"
				type="search"
				id="search-field"
				name="search"
				style="filter: blur(0px); margin-left: 0.5vw; margin-right: 0.5vw;"
				placeholder="Search"
				bind:value={search_string}
				on:input={search_gym}
			/><i class="fa fa-search" />
		</div>
	</form>
</div>
<div class="container">
	
		{#each gyms as gym}
			<Card
				id={gym[0]}
				name={gym[1].name}
				desc={gym[1].description}
				image_url={image_urls[gym[0]]}
				adresse={gym[1].city + ' ' + gym[1].street + ' ' + gym[1].houseNumber}
			/>
		{/each}
	</div>
	{/if}

<style>
	.sbar {
		text-align: center;
	}
</style>
