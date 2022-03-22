package com.example.inbloc_app.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.navigation.Navigation;
import androidx.recyclerview.widget.RecyclerView;

import com.example.inbloc_app.Gym;
import com.example.inbloc_app.R;
import com.example.inbloc_app.retrofit.models.Gyms;

import java.util.ArrayList;
import java.util.List;

public class GymsAdapter extends RecyclerView.Adapter<GymsAdapter.ViewHolder> {

    private Context context;
    private List<Gyms> showGyms = new ArrayList<>();
    public String passGymID;
    String namesArr[], locsArr[];
    int images[];
    Gym g;

    public GymsAdapter() {
        super();
    }

//    public GymsAdapter(Context context,
//        this.context = context;
//        this.showGyms = showGyms;
//
//    }

    public GymsAdapter(Context context, String names[], String locs[], int images[]){

        this.context = context;
        namesArr = names;
        locsArr = locs;
        this.images = images;
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {

        public TextView gymName;
        public TextView gymDescription;
        public ImageButton favorite;
        public ImageView logo;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            gymName = itemView.findViewById(R.id.gymslist_gymName);
            gymDescription = itemView.findViewById(R.id.gymslist_description);
            favorite = itemView.findViewById(R.id.gymslist_favorite);
            logo = itemView.findViewById(R.id.gymslist_logo);
        }
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        context = parent.getContext();
        return new GymsAdapter.ViewHolder(LayoutInflater.from(context)
        .inflate(R.layout.list_row_gym,parent,false));
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        holder.gymName.setText(namesArr[position]);
        holder.gymDescription.setText(locsArr[position]);
        holder.logo.setImageResource(images[position]);
        holder.itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Navigation.findNavController(view).navigate(R.id.action_myGyms_to_gymFragment);
            }
        });

        holder.favorite.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                holder.favorite.setImageResource(R.drawable.ic_favorite);
            }
        });

//        Gyms gyms = showGyms.get(position);
//        String gymName = gyms.getName();
//        String description = gyms.getDescription();
//
//        holder.gymName.setText(gymName);
//        holder.gymDescription.setText(description);

    }

    @Override
    public int getItemCount() {

        int len = namesArr.length;
        return len;
    }

    public void setData(List<Gyms> showGyms){
        this.showGyms = showGyms;
        notifyDataSetChanged();
    }

    public Gym getG() {
        return g;
    }
}
