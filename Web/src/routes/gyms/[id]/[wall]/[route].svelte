<script>
    import Route_heading from '$lib/route_heading.svelte';
    import Route_rating from '$lib/route_rating.svelte';
    import Reviews from '$lib/reviews.svelte';
    import { page } from '$app/stores';
    let {id, wall, route} = $page.params;
</script>

<Route_heading {id} {wall} {route}/>
<div class="d-flex justify-content-center justify-content-xxl-center">
    <hr class="d-xxl-flex" style="width: 70vw;">
</div>
<Route_rating/>
<Reviews {id} {wall} {route}/>