package com.isaac.wiki;

import android.content.Context;
import android.graphics.Bitmap;
import java.io.InputStream;
import android.graphics.BitmapFactory;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.view.View;
import androidx.recyclerview.widget.RecyclerView;
import com.isaac.wiki.databinding.ListItemBinding;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ListAdapter extends RecyclerView.Adapter<ListAdapter.ListViewHolder> {
    private Context mContext;
    private List<ItemData> datas;
    private SpriteSheet sprites;
    private OnItemClickListener listener;
    
    public interface OnItemClickListener {
        void onItemClick(int position);
    }
    
    public ListAdapter(Context context, List<ItemData> datas, SpriteSheet sprites, OnItemClickListener listener) {
        this.mContext = context;
        this.datas = datas;
        this.sprites = sprites;
        this.listener = listener;
    }

    @Override
    public ListViewHolder onCreateViewHolder(ViewGroup parent, int type) {
        ListItemBinding binding =
                ListItemBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false);
        return new ListViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(ListViewHolder holder, int position) {
        ItemData data = datas.get(position);
        holder.binding.name.setText(data.name_zh + "/" + data.name_en);
        holder.binding.icon.setImageBitmap(sprites.get(data.id));
        holder.binding.type.setText(data.category);
        holder.itemView.setOnClickListener(v -> {
            int pos = holder.getAdapterPosition();
            if(pos != RecyclerView.NO_POSITION && listener != null) {
            	listener.onItemClick(pos);
            }
        });
    }

    @Override
    public int getItemCount() {
        return datas.size();
    }

    public static class ListViewHolder extends RecyclerView.ViewHolder {
        public final ListItemBinding binding;

        public ListViewHolder(ListItemBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }
    
    public Bitmap loadFromAssets(String path) {
        try (InputStream is = mContext.getAssets().open(path)) {
            return BitmapFactory.decodeStream(is);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private boolean assetExists(String path) {
        try {
            mContext.getAssets().open(path).close();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
