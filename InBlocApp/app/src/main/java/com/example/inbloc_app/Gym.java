package com.example.inbloc_app;

import java.util.ArrayList;

public class Gym {

    private String name;
    private String loc;
    private int image;
    private int overview;
    private ArrayList<String> walls = new ArrayList<>();

    public Gym(String name, String loc, int image) {
        this.name = name;
        this.loc = loc;
        this.image = image;
    }

    public Gym() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLoc() {
        return loc;
    }

    public void setLoc(String loc) {
        this.loc = loc;
    }

    public int getImage() {
        return image;
    }

    public void setImage(int image) {
        this.image = image;
    }
}
