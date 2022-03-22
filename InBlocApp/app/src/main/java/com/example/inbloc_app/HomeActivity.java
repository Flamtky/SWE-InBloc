package com.example.inbloc_app;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.recyclerview.widget.RecyclerView;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.MenuItem;
import android.widget.Toast;

import com.example.inbloc_app.Fragments.MyGymsFragment;
import com.example.inbloc_app.Fragments.MyStatsFragment;
import com.example.inbloc_app.Fragments.ProjectsFragment;
import com.example.inbloc_app.Fragments.SearchFragment;
import com.example.inbloc_app.Fragments.SettingsFragment;
import com.example.inbloc_app.adapter.GymsAdapter;
import com.example.inbloc_app.retrofit.models.Gyms;
import com.example.inbloc_app.retrofit.remote.ApiService;
import com.example.inbloc_app.retrofit.remote.ApiUtils;
import com.google.android.material.navigation.NavigationView;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeActivity extends AppCompatActivity implements NavigationView.OnNavigationItemSelectedListener {

    private static final String TAG = "";
    private DrawerLayout drawer;
    public RecyclerView recyclerViewGyms;
    private ApiService apiService;
    public List<Gyms> gymsList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        drawer = findViewById(R.id.drawer_layout);
        NavigationView navigationView = findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);


        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(this, drawer, toolbar,
                R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawer.addDrawerListener(toggle);
        toggle.syncState();

        if (savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,
                    new MyGymsFragment()).commit();
            navigationView.setCheckedItem(R.id.nav_my_gyms);
        }

        loadGyms();



    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem item) {
        switch (item.getItemId()){
            case R.id.nav_find_gyms:
                getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,
                        new SearchFragment()).commit();
                break;
            case R.id.nav_projects:
                getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,
                        new ProjectsFragment()).commit();
                break;
            case R.id.nav_my_gyms:
                getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,
                        new MyGymsFragment()).commit();
                break;
            case R.id.nav_stats:
                getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,
                        new MyStatsFragment()).commit();
                break;
            case R.id.nav_settings:
                getSupportFragmentManager().beginTransaction().replace(R.id.fragment_container,
                        new SettingsFragment()).commit();
                break;
            case R.id.nav_logout:
                Toast.makeText(this, "Logged Out", Toast.LENGTH_SHORT).show();
                Intent intent = new Intent(this, LoginActivity.class);
                startActivity(intent);
                break;
        }

        drawer.closeDrawer(GravityCompat.START);
        return true;
    }

    @Override
    public void onBackPressed() {
        if (drawer.isDrawerOpen(GravityCompat.START)){
            drawer.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }

    private void loadGyms(){

        apiService = ApiUtils.getApiService();

        Call<List<Gyms>> call = apiService.getAllGyms("asdjg");
        call.enqueue(new Callback<List<Gyms>>() {
            @Override
            public void onResponse(Call<List<Gyms>> call, Response<List<Gyms>> response) {

                if (!response.isSuccessful()){
                    Log.i(TAG, "Call unsuccessful");
                }
                Log.i(TAG, "Call successful!\n" + response.body());
                gymsList = response.body();

                GymsAdapter gymsAdapter = new GymsAdapter(getApplicationContext(), gymsList);
                gymsAdapter.setData(gymsList);
                recyclerViewGyms.setAdapter(gymsAdapter);

            }

            @Override
            public void onFailure(Call<List<Gyms>> call, Throwable t) {
                Log.i(TAG, "No Response from API...");
            }
        });

    }
}