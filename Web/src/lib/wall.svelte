<script>
	import {goto, prefetch} from '$app/navigation';
	import { page } from '$app/stores';
	export let gym;
	export let gymId;
    export let name;
    export let wall_name;
	let route_counter=0;
    let adresse;
	if(gym){
		adresse = gym.street + ' ' + gym.houseNumber + ' ' + gym.zip + ' ' + gym.city;
	}
    export let routes;
	//TODO: Implement routes to be shown in the list. They should be clickable and redirect to a route page
</script>

<div
	class="container d-flex flex-row flex-grow-0 flex-shrink-0 justify-content-evenly justify-content-sm-start justify-content-md-start align-items-lg-center align-items-xl-center justify-content-xxl-center align-items-xxl-center"
>

	<!-- Start: Heading -->
	<div
		class="order-sm-first order-md-first order-lg-last order-xl-last order-xxl-last"
		style="background: rgba(0,0,0,0);border-radius: 10px;border: 2px solid rgba(0,0,0,0.25);padding: 0px;padding-left: 5px;padding-right: 5px;width: 350px;margin-top: 10px;margin-bottom: 10px;"
		>
		<h1>{name}</h1>
		<h2>{wall_name}</h2>
		<h5>{adresse}</h5>
		<button class="btn btn-primary d-block w-100" style="margin-top: 5px;" on:mouseenter={prefetch(`/gyms/${gymId}`)} on:click={goto(`/gyms/${gymId}`)}>Back to Gym</button>
	</div>
	<!-- End: Heading -->
	<div class="d-xxl-flex order-2 justify-content-xxl-end" style="width: 150px;min-width: 0px;" />
	<!-- Start: Route List -->
	<div
		style="background: rgba(0,0,0,0);margin-top: 15px;width: 350px;border-radius: 10px;border: 2px solid rgba(0,0,0,0.25);"
	>
		<div style="max-width: 350px;min-width: 250px;">
			<h1 class="text-center" style="width: 300px;">Routes</h1>
			<ul class="list-group" style="max-width: 350px;">
				{#if routes}
				{#each routes as route}
				{#if route}
				<li
					class="list-group-item"
					style="cursor: pointer; border-width: 3px;border-style: solid;border-radius: 10px;border-bottom-right-radius: 10px;border-bottom-left-radius: 10px;margin-bottom: 3px;margin-right: 5px;margin-left: 5px;"
					on:click={()=>{goto(`${$page.url.pathname}/${route[0]}`)}}
					>
				{route[0]} <span class="text-muted" >Difficulty: {route[1].difficulty} </span><small class="text-muted">Features: {route[1].features}</small>
				</li>
				{/if}
				{/each}
				{:else}
				<li
					class="list-group-item"
					style="border-width: 3px;border-style: solid;border-radius: 10px;border-bottom-right-radius: 10px;border-bottom-left-radius: 10px;margin-bottom: 3px;margin-right: 5px;margin-left: 5px;"
				>
					<span>There are no Routes on this Wall</span>
				</li>
				{/if}
			</ul>
		</div>
	</div>
	<!-- End: Route List -->
</div>
<!-- End: Container -->
