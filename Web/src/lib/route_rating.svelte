<script>
    import { page } from '$app/stores';
    import '$lib/firebase.js';
	  import { getAuth, onAuthStateChanged } from 'firebase/auth';
    let { id, wall, route } = $page.params;
    let route_data=null;
    let user_ratings_avg=null;
    let user_rating = null;

  async function load() {
    if (getAuth().currentUser) {
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(`https://flamtkzx.flamtky.dev/routes/${route}?gymId=${id}&wallId=${wall}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});
            if(res.ok){
                let json = await res.json();
                route_data = json.data.route;
                user_ratings_avg = route_data.userRatings;
                console.log(user_ratings_avg);
            }
          }
        }

  async function send_Rating(){
    if (getAuth().currentUser && user_rating != null && (user_rating > -3 && user_rating < 3)) {
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(`https://flamtkzx.flamtky.dev/routes/${route}/userRatings?gymId=${id}&wallId=${wall}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
        body: JSON.stringify({
          userRating: user_rating
        })
			});
          }
      await load();
  }

        onAuthStateChanged(getAuth(), async (user) => {
		if (user) {
			if (!route_data) {
				await load();
			}
		} else {
			route_data = null;
		}
	});
</script>

<div class="user-body">
    <!-- Start: heading --><span class="heading">User Rating</span><br><!-- End: heading -->
    <p>Please klick on the Icons below to Vote if the Route is rather hard or easy</p>
    <!-- Start: fa fa-star checked --><span id="h" class="fa fa-angle-double-down" on:mouseenter={()=>{user_rating = -2;}} on:click={send_Rating} aria-hidden="true"></span><!-- End: fa fa-star checked -->
    <!-- Start: fa fa-star checked --><span id="h" class="fa fa-angle-down" on:mouseenter={()=>{user_rating = -1}} on:click={send_Rating} aria-hidden="true"></span><!-- End: fa fa-star checked -->
    <!-- Start: fa fa-star checked --><span id="h" class="fa fa-genderless" on:mouseenter={()=>{user_rating = 0}} on:click={send_Rating} aria-hidden="true"></span><!-- End: fa fa-star checked -->
    <!-- Start: fa fa-star checked --><span id="h" class="fa fa-angle-up" on:mouseenter={()=>{user_rating = 1}} on:click={send_Rating} aria-hidden="true"></span><!-- End: fa fa-star checked -->
    <!-- Start: fa fa-star --><span id="h" class="fa fa-angle-double-up " on:mouseenter={()=>{user_rating = 2}} on:click={send_Rating} aria-hidden="true"></span><!-- End: fa fa-star -->
    <hr style="border:3px solid #f1f1f1"><!-- Start: rg-row -->
    <div class="rg-row">
        <!-- Start: side -->
        <div class="side">
            <div>
                <p>Easy</p>
            </div>
        </div><!-- End: side -->
        <!-- Start: middle -->
        <div class="middle">
            <!-- Start: bar-container -->
            <div class="bar-container progress">
                <!-- Start: bar-5 -->
                <div class="progress-bar" role="progressbar" aria-valuenow="70"
                aria-valuemin="0" aria-valuemax="100" style="width:{user_ratings_avg || 0}%"></div><!-- End: bar-5 -->
            </div><!-- End: bar-container -->
        </div><!-- End: middle -->
        <!-- Start: side right -->
        <div class="side right">
            <div>
                <p>Hard</p>
            </div>
        </div><!-- End: side right -->
    </div><!-- End: rg-row -->
</div><!-- End: User-Rating-F19690 -->


<style>
    .fa {
  display: inline-block;
  font: normal normal normal 14px/1 FontAwesome;
  font-size: inherit;
  text-rendering: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.fa-star:before {
  content: "\f005";
}

* {
  box-sizing: border-box;
}

.user-body {
  font-family: Arial;
  margin: 0 auto;
  max-width: 800px;
  padding: 20px !important;
}

.heading {
  font-size: 25px;
  margin-right: 25px;
}

.fa {
  font-size: 25px;
}

.checked {
  color: orange;
}

.side {
  float: left;
  width: 15%;
  margin-top: 10px;
}

.middle {
  margin-top: 10px;
  float: left;
  width: 70%;
}

.right {
  text-align: right;
}

.rg-row:after {
  content: "";
  display: table;
  clear: both;
}

.bar-container {
  width: 100%;
  background-color: #f1f1f1;
  text-align: center;
  color: white;
}

.bar-5 {
  width: 60%;
  height: 18px;
  background-color: #4CAF50;
}

.bar-4 {
  width: 30%;
  height: 18px;
  background-color: #2196F3;
}

.bar-3 {
  width: 10%;
  height: 18px;
  background-color: #00bcd4;
}

.bar-2 {
  width: 4%;
  height: 18px;
  background-color: #ff9800;
}

.bar-1 {
  width: 15%;
  height: 18px;
  background-color: #f44336;
}

@media (max-width: 400px) {
  .side, .middle {
    width: 100%;
  }
}

@media (max-width: 400px) {
  .right {
    display: none;
  }
}

#h:hover {
  color: #5feb82;
}


</style>