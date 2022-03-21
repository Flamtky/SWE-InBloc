
    <script>
        import {goto} from '$app/navigation';
        import { page } from '$app/stores';
        export let name = "Hallen Name";
        export let desc = "Hier würde eine kurze beschreibung der Halle stehen";
        export let image_url = "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.antenneniederrhein.de%2Fexternalimages%2F%3Fsource%3Djpg248%2Fboulderhalle-kleve.jpg%26crop%3D0x125x6000x3750%26resize%3D1280x800%26dt%3D202007130845510&f=1&nofb=1";
        export let adresse = "Hier würde die Adresse stehen";
        export let email = "test@testmail.com";
        export let phone = "0123456789";
        export let website = "https://www.test.com";
        export let opening_hours;
        export let override_opening_hours;
        export let Walls;
        console.log(opening_hours)
    </script>
    
    <div class="container border rounded-0" style="margin-top: 10px;/*margin-left: 100px;*/padding-bottom: 10px;">
        <!-- Start: div-image -->
        <div style="margin-top: 10px;"><img src={image_url} style="max-height: 220px;min-height: 150px;"></div><!-- End: div-image -->
        <!-- Start: div-name -->
        <div>
            <!-- Start: name -->
            <h1>{name}</h1><!-- End: name -->
            <div>
                <!-- Start: description -->
                <p>{desc}</p><!-- End: description -->
            </div>
            <small class="text-muted">{adresse}</small><br>
            <small class="text-muted">{email}</small><br>
            <small class="text-muted">{phone}</small><br>
            <a class="text-muted bottom-0" style="font-size: small;" href={website} target="_blank">{website}</a>
        </div><!-- End: div-name --><button class="btn btn-outline-danger" type="button" style="height:40px;width: 45px;margin-top: 20px;">
            <i class="fa fa-heart" aria-hidden="true"></i></button>
    </div>
    <div class="container" style="display: flex;padding-top: 15px;">
        <div style="justify-content: flex-start;">
            <h2>Opening Hours</h2>
            {#if opening_hours}
            <ul style="list-style-type: none;">
                <li><b>Monday: </b>{opening_hours.monday.open + "-" + opening_hours.monday.closed}</li>
                <li><b>Tuesday: </b>{opening_hours.tuesday.open + "-" + opening_hours.tuesday.closed}</li>
                <li><b>Wednesday: </b>{opening_hours.wednesday.open + "-" + opening_hours.wednesday.closed}</li>
                <li><b>Thursday: </b>{opening_hours.thursday.open + "-" + opening_hours.thursday.closed}</li>
                <li><b>Friday: </b>{opening_hours.friday.open + "-" + opening_hours.friday.closed}</li>
                <li><b>Saturday: </b>{opening_hours.saturday.open + "-" + opening_hours.saturday.closed}</li>
                <li><b>Sunday: </b>{opening_hours.sunday.open + "-" + opening_hours.sunday.closed}</li>
            </ul>
            {/if}
            {#if override_opening_hours}
            <p>Please note our special opening hours:</p>
            <ul style="list-style-type: none;">
                {#each override_opening_hours as day}
                <li><b>{day[0]}: </b>{day[1].open + "-" + day[1].closed}</li>
                {/each}
            </ul>
            {/if}
        </div>
        <div style="max-width: 15vw;min-width: 0;"></div>
        <div>
            <h2>Walls</h2>
            <ul class="list-group" style="min-width: 12vw;">
                {#if Walls}
                {#each Walls as wall}
                <li class="list-group-item " style="cursor: pointer;" on:click={()=>{goto(`${$page.url.pathname}/${wall[0]}`)}}><span>{wall[0]}</span></li>
                {/each}
                {/if}
            </ul>
        </div>
    </div>
