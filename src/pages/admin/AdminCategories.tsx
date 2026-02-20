import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CategoryItem } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_FILE_SIZE = 8 * 1024 * 1024;

export default function AdminCategories() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [video, setVideo] = useState<string | null>(null);
  const [isMediaProcessing, setIsMediaProcessing] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editVideo, setEditVideo] = useState<string | null>(null);
  const [isEditMediaProcessing, setIsEditMediaProcessing] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.getCategoriesAdmin(token || ""),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.createCategoryAdmin(token || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setName("");
      setImage("");
      setVideo(null);
      toast({ title: "Category added", description: "Category created successfully." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: unknown }) =>
      api.updateCategoryAdmin(token || "", payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditing(null);
      toast({ title: "Category updated", description: "Category updated successfully." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategoryAdmin(token || "", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: "Category deleted", description: "Category removed successfully." });
    },
  });

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (files: FileList | null, forEdit: boolean) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid image file", description: "Please upload a valid image.", variant: "destructive" });
      return;
    }
    if (file.size > IMAGE_MAX_FILE_SIZE) {
      toast({ title: "Image too large", description: "Use an image smaller than 5MB.", variant: "destructive" });
      return;
    }
    forEdit ? setIsEditMediaProcessing(true) : setIsMediaProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (forEdit) {
        setEditImage(dataUrl);
      } else {
        setImage(dataUrl);
      }
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Please try another file.",
        variant: "destructive",
      });
    } finally {
      forEdit ? setIsEditMediaProcessing(false) : setIsMediaProcessing(false);
    }
  };

  const handleVideoUpload = async (files: FileList | null, forEdit: boolean) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid video file", description: "Please upload a valid video.", variant: "destructive" });
      return;
    }
    if (file.size > VIDEO_MAX_FILE_SIZE) {
      toast({ title: "Video too large", description: "Use a video smaller than 8MB.", variant: "destructive" });
      return;
    }
    forEdit ? setIsEditMediaProcessing(true) : setIsMediaProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (forEdit) {
        setEditVideo(dataUrl);
      } else {
        setVideo(dataUrl);
      }
    } catch (error) {
      toast({
        title: "Video upload failed",
        description: error instanceof Error ? error.message : "Please try another file.",
        variant: "destructive",
      });
    } finally {
      forEdit ? setIsEditMediaProcessing(false) : setIsMediaProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>

        <div className="grid gap-4 max-w-xl mb-8">
          <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid gap-2">
            <Label htmlFor="category-image">Category image (optional)</Label>
            <Input
              id="category-image"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files, false)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category-video">Category video (optional)</Label>
            <Input
              id="category-video"
              type="file"
              accept="video/*"
              onChange={(e) => handleVideoUpload(e.target.files, false)}
            />
          </div>
          {(image || video) && (
            <div className="flex gap-3">
              {image && (
                <img src={image} alt="Category preview" className="h-16 w-16 rounded-md object-cover border" />
              )}
              {video && (
                <video src={video} className="h-16 w-24 rounded-md border object-cover" muted loop playsInline />
              )}
            </div>
          )}
          <Button
            onClick={() => createMutation.mutate({ name, image: image || undefined, video: video || undefined })}
            disabled={!name || isMediaProcessing}
          >
            {isMediaProcessing ? "Processing..." : "Add Category"}
          </Button>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to manage categories.</div>
        ) : isLoading ? (
          <div className="text-muted-foreground">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(categories as CategoryItem[]).map((category) => (
              <div key={category.id} className="border border-border/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.id}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(category);
                      setEditName(category.name);
                      setEditImage(category.image || "");
                      setEditVideo(category.video || null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(category.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              <div className="grid gap-2">
                <Label htmlFor="edit-category-image">Category image</Label>
                <Input
                  id="edit-category-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files, true)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category-video">Category video</Label>
                <Input
                  id="edit-category-video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoUpload(e.target.files, true)}
                />
              </div>
              {(editImage || editVideo) && (
                <div className="flex gap-3">
                  {editImage && (
                    <img src={editImage} alt="Category preview" className="h-16 w-16 rounded-md object-cover border" />
                  )}
                  {editVideo && (
                    <video src={editVideo} className="h-16 w-24 rounded-md border object-cover" muted loop playsInline />
                  )}
                </div>
              )}
              {editVideo && (
                <Button variant="outline" size="sm" onClick={() => setEditVideo(null)}>
                  Remove video
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                editing &&
                updateMutation.mutate({
                  id: editing.id,
                  data: {
                    name: editName,
                    image: editImage || undefined,
                    video: editVideo ?? null,
                  },
                })
              }
              disabled={!editName || isEditMediaProcessing || updateMutation.isPending}
            >
              {isEditMediaProcessing || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
