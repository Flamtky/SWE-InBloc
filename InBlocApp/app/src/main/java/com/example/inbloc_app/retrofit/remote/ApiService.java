package com.example.inbloc_app.retrofit.remote;

import com.example.inbloc_app.retrofit.models.Gyms;
import com.example.inbloc_app.retrofit.models.Walls;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;

import java.util.List;

public interface ApiService {

    @GET("/gyms")
    Call<List<Gyms>> getAllGyms(@Header("debug") String deb);

    @GET("/gyms/")
    Call<Gyms> getSpecificGym();

    @GET("/walls")
    Call<List<Walls>> getWalls();

    @GET("/walls")
    Call<Walls> getSpecificWall();


}
