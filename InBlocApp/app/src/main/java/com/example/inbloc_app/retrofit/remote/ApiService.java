package com.example.inbloc_app.retrofit.remote;

import com.example.inbloc_app.retrofit.models.Gyms;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

import java.util.List;

public interface ApiService {

    @GET("/gyms")
    Call<List<Gyms>> getGyms();


}
