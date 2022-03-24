package com.example.inbloc_app.retrofit.models;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class Walls {

    @SerializedName("features")
    @Expose
    private String features;
    @SerializedName("setDate")
    @Expose
    private String setDate;

    public String getFeatures() {
        return features;
    }

    public void setFeatures(String features) {
        this.features = features;
    }

    public String getSetDate() {
        return setDate;
    }

    public void setSetDate(String setDate) {
        this.setDate = setDate;
    }

}
