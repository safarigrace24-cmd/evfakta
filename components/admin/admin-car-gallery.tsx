"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  removeGalleryImageAction,
  reorderGalleryImagesAction,
  replaceGalleryImageAction,
  setGalleryImagePrimaryAction,
  updateGalleryImageTypeAction,
  uploadGalleryImageAction,
} from "@/app/admin/gallery-actions";
import {
  CAR_IMAGE_TYPE_LABELS,
  CAR_IMAGE_TYPE_OPTIONS,
  type CarImageRow,
  type CarImageType,
} from "@/lib/admin/car-image-types";

type AdminCarGalleryProps = {
  carId: string;
  carSlug: string;
  initialImages: CarImageRow[];
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.split(",")[1] ?? "" : result;
      if (!base64) {
        reject(new Error("empty"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export default function AdminCarGallery({
  carId,
  carSlug,
  initialImages,
}: AdminCarGalleryProps) {
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [uploadType, setUploadType] = useState<CarImageType>("other");
  const [makePrimary, setMakePrimary] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  function refresh() {
    router.refresh();
  }

  function withFeedback(action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      refresh();
    });
  }

  function onUploadFiles(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;

    setError(null);
    setMessage(null);

    startTransition(async () => {
      let lastMessage = "";
      let uploaded = 0;

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        try {
          const base64 = await readFileAsBase64(file);
          const result = await uploadGalleryImageAction({
            carId,
            base64,
            contentType: file.type,
            imageType: uploadType,
            makePrimary: (makePrimary || images.length === 0) && i === 0,
          });
          if (!result.ok) {
            setError(result.error);
            break;
          }
          lastMessage = result.message;
          uploaded += 1;
        } catch {
          setError("Kunne ikke lese bildefilen. Prøv igjen.");
          break;
        }
      }

      if (uploaded > 0) {
        setMessage(
          uploaded === 1
            ? lastMessage
            : `${uploaded} bilder er lagt til i galleriet.`,
        );
        setMakePrimary(false);
        refresh();
      }

      if (uploadRef.current) uploadRef.current.value = "";
    });
  }

  function onReplaceFile(fileList: FileList | null) {
    const file = fileList?.[0];
    const imageId = replaceId;
    if (!file || !imageId) return;

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const base64 = await readFileAsBase64(file);
        const result = await replaceGalleryImageAction({
          imageId,
          base64,
          contentType: file.type,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result.message);
        refresh();
      } catch {
        setError("Kunne ikke lese bildefilen. Prøv igjen.");
      } finally {
        setReplaceId(null);
        if (replaceRef.current) replaceRef.current.value = "";
      }
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setImages(next);

    withFeedback(() =>
      reorderGalleryImagesAction(
        carId,
        next.map((image) => image.id),
      ),
    );
  }

  return (
    <div className="adminForm adminGalleryCard">
      <div className="adminGalleryHeader">
        <div>
          <h2 className="adminGalleryTitle">Bildegalleri</h2>
          <p className="adminImageHint">
            Lagres som <code>car-images/{carSlug}/{"{unik}"}.webp</code>. Primærbildet brukes på
            kort og synkroniseres til bilens bildebane.
          </p>
        </div>
      </div>

      <div className="adminGalleryUpload">
        <label className="authField">
          <span>Bildetype for nye opplastinger</span>
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value as CarImageType)}
            disabled={isPending}
          >
            {CAR_IMAGE_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {CAR_IMAGE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="adminCheckbox">
          <input
            type="checkbox"
            checked={makePrimary}
            onChange={(e) => setMakePrimary(e.target.checked)}
            disabled={isPending}
          />
          <span>Sett første nye bilde som primær</span>
        </label>

        <input
          ref={uploadRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          form=""
          hidden
          disabled={isPending}
          onChange={(e) => onUploadFiles(e.target.files)}
        />
        <input
          ref={replaceRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          form=""
          hidden
          disabled={isPending}
          onChange={(e) => onReplaceFile(e.target.files)}
        />

        <button
          type="button"
          className="button primary buttonSm"
          onClick={() => uploadRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? "Jobber…" : "Last opp bilder"}
        </button>
      </div>

      {images.length === 0 ? (
        <p className="adminImageHint">Ingen galleribilder ennå.</p>
      ) : (
        <ul className="adminGalleryList">
          {images.map((image, index) => (
            <li key={image.id} className="adminGalleryItem">
              <div className="adminGalleryPreview">
                <Image
                  src={`${image.image_url}${image.image_url.includes("?") ? "&" : "?"}v=${encodeURIComponent(image.storage_path)}`}
                  alt={image.alt_text || `${CAR_IMAGE_TYPE_LABELS[image.image_type]} bilde`}
                  fill
                  sizes="180px"
                  unoptimized
                  className="adminImagePreviewImg"
                />
                {image.is_primary && <span className="adminGalleryBadge">Primær</span>}
              </div>

              <div className="adminGalleryItemBody">
                <label className="authField">
                  <span>Type</span>
                  <select
                    value={image.image_type}
                    disabled={isPending}
                    onChange={(e) => {
                      const nextType = e.target.value as CarImageType;
                      setImages((current) =>
                        current.map((row) =>
                          row.id === image.id ? { ...row, image_type: nextType } : row,
                        ),
                      );
                      withFeedback(() => updateGalleryImageTypeAction(image.id, nextType));
                    }}
                  >
                    {CAR_IMAGE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {CAR_IMAGE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="adminGalleryItemActions">
                  {!image.is_primary && (
                    <button
                      type="button"
                      className="button secondary buttonSm"
                      disabled={isPending}
                      onClick={() => withFeedback(() => setGalleryImagePrimaryAction(image.id))}
                    >
                      Sett som primær
                    </button>
                  )}
                  <button
                    type="button"
                    className="button secondary buttonSm"
                    disabled={isPending}
                    onClick={() => {
                      setReplaceId(image.id);
                      replaceRef.current?.click();
                    }}
                  >
                    Bytt bilde
                  </button>
                  <button
                    type="button"
                    className="button ghost buttonSm"
                    disabled={isPending || index === 0}
                    onClick={() => moveImage(index, -1)}
                  >
                    Opp
                  </button>
                  <button
                    type="button"
                    className="button ghost buttonSm"
                    disabled={isPending || index === images.length - 1}
                    onClick={() => moveImage(index, 1)}
                  >
                    Ned
                  </button>
                  <button
                    type="button"
                    className="button ghost buttonSm adminDangerButton"
                    disabled={isPending}
                    onClick={() =>
                      withFeedback(async () => {
                        const result = await removeGalleryImageAction(image.id);
                        if (result.ok) {
                          setImages((current) => current.filter((row) => row.id !== image.id));
                        }
                        return result;
                      })
                    }
                  >
                    Fjern
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p className="authAlert authAlertSuccess" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="authAlert authAlertError" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
