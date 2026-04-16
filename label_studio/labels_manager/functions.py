from django.db import transaction
from tasks.models import Annotation


def bulk_update_label(old_label, new_label, organization, project=None):
    annotations = Annotation.objects.filter(project__organization=organization)
    if project is not None:
        annotations = annotations.filter(project=project)

    updated_count = 0
    with transaction.atomic():
        update_annotations = []
        for annotation in annotations.only('result').all():
            result = annotation.result

            updated_result = []
            need_update = False
            for region in result:
                result_type = region.get('type')
                if result_type is not None:
                    label = region['value'].get(result_type)
                    if label is not None and label == old_label:
                        region['value'][result_type] = new_label
                        updated_count += 1
                        need_update = True
                updated_result.append(region)

            if need_update:
                annotation.result = updated_result
                update_annotations.append(annotation)

        if update_annotations:
            Annotation.objects.bulk_update(update_annotations, ['result'])
    return updated_count


def bulk_delete_label_references(label_value, organization, project=None):
    """Remove all references to a deleted label from annotations"""
    annotations = Annotation.objects.filter(project__organization=organization)
    if project is not None:
        annotations = annotations.filter(project=project)

    deleted_count = 0
    with transaction.atomic():
        update_annotations = []
        for annotation in annotations.only('result', 'id').all():
            if not annotation.result:
                continue

            result = annotation.result
            updated_result = []
            need_update = False

            for region in result:
                result_type = region.get('type')
                should_keep = True

                if result_type is not None and 'value' in region:
                    label = region['value'].get(result_type)
                    # Check if this region references the deleted label
                    if label is not None and label == label_value:
                        should_keep = False
                        deleted_count += 1
                        need_update = True

                if should_keep:
                    updated_result.append(region)

            if need_update:
                annotation.result = updated_result
                update_annotations.append(annotation)

        if update_annotations:
            Annotation.objects.bulk_update(update_annotations, ['result'])

    return deleted_count
