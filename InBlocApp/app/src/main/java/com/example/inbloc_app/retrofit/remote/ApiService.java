package com.example.inbloc_app.retrofit.remote;

import com.example.inbloc_app.retrofit.models.Gyms;
import com.example.inbloc_app.retrofit.models.Walls;

import okhttp3.Response;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;

import java.util.List;

public interface ApiService {

    @GET("/gyms")
    Call<ResponseBody> getAllGyms(@Header("Authorization") String deb,
                              @Header("Content-Type") String type);

    @GET("/gyms/")
    Call<Gyms> getSpecificGym();

    @GET("/walls")
    Call<List<Walls>> getWalls();

    @GET("/walls")
    Call<Walls> getSpecificWall();

}
